<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ErrorBoundary from '$lib/components/error-boundary.svelte';
	import ModuleCard from '$lib/components/modules/module-card.svelte';
	import PriorityManager from '$lib/components/modules/priority-manager.svelte';
	import ResultsDisplay from '$lib/components/modules/results-display.svelte';
	import SettingsPanel from '$lib/components/modules/settings-panel.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		getEffectName,
		isKnownEffectId,
		MODULE_DEFAULT_NAME_PREFIX,
		MODULE_MAX_PRIORITY_EFFECTS
	} from '$lib/constants';
	import { modulesOptimizerStore } from '$lib/stores/modules-optimizer.svelte';
	import type { OptimizationResult } from '$lib/types/modules';
	import {
		createEmptyModule,
		findOptimalSetup,
		removeModule,
		updateModuleEffect
	} from '$lib/utils/modules';
	import { showToast } from '$lib/utils/toast';
	import { Calculator, Plus, Settings, Target, Trash, Zap } from '@lucide/svelte/icons';
	import pako from 'pako';

	let modules = $state(modulesOptimizerStore.modules);
	let priorityEffects = $state(modulesOptimizerStore.priorityEffects);
	let numSlots = $state(modulesOptimizerStore.numSlots);
	let result = $state<OptimizationResult | null>(null);
	let isCalculating = $state(false);
	let activeTab = $state<'modules' | 'priorities' | 'results'>('modules');
	let showClearDialog = $state(false);

	const canonicalUrl = `${page.url.origin}${page.url.pathname}`;

	// Decode and import module data from URL params
	onMount(async () => {
		const encodedData = page.url.searchParams.get('data');

		if (encodedData) {
			try {
				// Decode base64 URL-safe string (handle padding)
				let base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
				while (base64.length % 4) {
					base64 += '=';
				}
				const base64Decoded = atob(base64);

				// Convert base64 string to Uint8Array for pako
				const bytes = new Uint8Array(base64Decoded.length);
				for (let i = 0; i < base64Decoded.length; i++) {
					bytes[i] = base64Decoded.charCodeAt(i);
				}

				// Decompress gzip data
				const decompressed = pako.inflate(bytes, { to: 'string' });
				const moduleData = JSON.parse(decompressed);

				if (moduleData.modules && Array.isArray(moduleData.modules)) {
					modulesOptimizerStore.clearAll();

					type ImportedModule = {
						effects?: Array<{ id?: number; level?: number }>;
					};

					const unknownEffectIds = new SvelteSet<number>();

					const importedModules = moduleData.modules.map((m: ImportedModule, index: number) => ({
						id: `${MODULE_DEFAULT_NAME_PREFIX} ${index + 1}`,
						effects: Array.from({ length: 3 }, (_, i) => {
							const effect = m.effects?.[i];
							if (effect?.id == null) {
								return { name: '', level: 0 };
							}

							if (!isKnownEffectId(effect.id)) {
								unknownEffectIds.add(effect.id);
							}

							return {
								name: getEffectName(effect.id),
								level: effect.level || 0
							};
						})
					}));

					modulesOptimizerStore.setModules(importedModules);
					modules = modulesOptimizerStore.modules;

					result = null;
					activeTab = 'modules';

					showToast.success(`Imported ${importedModules.length} modules from game`);
					if (unknownEffectIds.size > 0) {
						const idsList = Array.from(unknownEffectIds)
							.sort((a, b) => a - b)
							.join(', ');
						showToast.warning(`Some effects in this import are not recognized (IDs: ${idsList}).`);
					}

					await goto(resolve('/modules-optimizer'), { replaceState: true, noScroll: true });
				} else {
					showToast.error('Invalid module data format.');
				}
			} catch {
				showToast.error('Failed to import module data. Please try again.');
			}
		}
	});

	const validModulesCount = $derived(
		modules.filter((module) => module.effects.some((effect) => effect.name && effect.level > 0))
			.length
	);

	const canCalculate = $derived(
		validModulesCount >= parseInt(numSlots) && priorityEffects.length > 0
	);

	function addModule() {
		const newId = `${MODULE_DEFAULT_NAME_PREFIX} ${modules.length + 1}`;
		modules = [...modules, createEmptyModule(newId)];
		modulesOptimizerStore.setModules(modules);
		showToast.success(`Added ${newId}`);
	}

	function removeModuleHandler(index: number) {
		modules = removeModule(modules, index);
		modulesOptimizerStore.setModules(modules);
		showToast.success('Module removed');
	}

	function updateEffect(
		moduleIndex: number,
		effectIndex: number,
		field: 'name' | 'level',
		value: string | number
	) {
		modules = updateModuleEffect(modules, moduleIndex, effectIndex, field, value);
		modulesOptimizerStore.setModules(modules);
	}

	function togglePriorityEffect(effect: string) {
		if (priorityEffects.includes(effect)) {
			priorityEffects = priorityEffects.filter((e) => e !== effect);
		} else if (priorityEffects.length < MODULE_MAX_PRIORITY_EFFECTS) {
			priorityEffects = [...priorityEffects, effect];
		} else {
			showToast.error(`Maximum ${MODULE_MAX_PRIORITY_EFFECTS} priority effects allowed`);
			return;
		}
		modulesOptimizerStore.setPriorityEffects(priorityEffects);
	}

	function movePriorityEffect(index: number, direction: 'up' | 'down') {
		const newEffects = [...priorityEffects];
		const newIndex = direction === 'up' ? index - 1 : index + 1;

		if (newIndex >= 0 && newIndex < newEffects.length) {
			[newEffects[index], newEffects[newIndex]] = [newEffects[newIndex], newEffects[index]];
			priorityEffects = newEffects;
			modulesOptimizerStore.setPriorityEffects(priorityEffects);
		}
	}

	async function calculateOptimalSetup() {
		if (!canCalculate) {
			if (validModulesCount < parseInt(numSlots)) {
				showToast.error(`You need at least ${numSlots} modules with effects to calculate.`);
			} else {
				showToast.error('Please select at least one priority effect.');
			}
			return;
		}

		isCalculating = true;

		try {
			result = await findOptimalSetup(modules, parseInt(numSlots), priorityEffects);
			showToast.success(`Optimal setup found! Score: ${result.totalScore}`);
			activeTab = 'results';
		} catch (error) {
			showToast.error(error instanceof Error ? error.message : 'Calculation failed');
		} finally {
			isCalculating = false;
		}
	}

	function clearAll() {
		modulesOptimizerStore.clearAll();
		modules = modulesOptimizerStore.modules;
		priorityEffects = modulesOptimizerStore.priorityEffects;
		numSlots = modulesOptimizerStore.numSlots;
		result = null;
		showClearDialog = false;
		showToast.success('All data cleared');
	}
</script>

<SeoHead
	title="Modules Optimizer | BP Timer"
	description="Optimize your Blue Protocol module combinations for maximum effectiveness. Find the best module setup based on priority effects and available slots."
	keywords="blue protocol modules optimizer, BPSR module calculator, module combinations, priority effects"
	{canonicalUrl}
/>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader />
			<div class="container mx-auto space-y-6 p-4">
				<PageHeader
					icon={Calculator}
					title="Modules Optimizer"
					subtitle="Find the optimal module combination for your setup"
				/>

				<Tabs.Root bind:value={activeTab} class="space-y-6">
					<Tabs.List class="grid w-full grid-cols-3">
						<Tabs.Trigger value="modules" class="flex items-center gap-2">
							<Settings class="h-4 w-4" />
							<span class="hidden md:inline">Modules & Settings</span>
							<span class="md:hidden">Modules</span>
						</Tabs.Trigger>
						<Tabs.Trigger value="priorities" class="flex items-center gap-2">
							<Target class="h-4 w-4" />
							<span class="hidden md:inline">Priority Effects</span>
							<span class="md:hidden">Priority</span>
						</Tabs.Trigger>
						<Tabs.Trigger value="results" class="flex items-center gap-2" disabled={!result}>
							<Zap class="h-4 w-4" />
							Results
							{#if result}
								<Badge variant="secondary" class="ml-1">{result.totalScore}</Badge>
							{/if}
						</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="modules" class="space-y-6">
						<div class="grid gap-6 lg:grid-cols-3">
							<div class="flex max-h-[calc(100vh-12rem)] flex-col overflow-hidden lg:col-span-2">
								<div class="flex shrink-0 items-center justify-between border-b bg-background pb-4">
									<div>
										<h2 class="text-xl font-semibold">Your Modules</h2>
										<p class="text-sm text-muted-foreground">
											Valid modules: {validModulesCount}/{modules.length}
										</p>
									</div>
									<div class="flex gap-2">
										<Button variant="outline" size="sm" onclick={() => (showClearDialog = true)}>
											<Trash class="h-4 w-4" />
											Clear All
										</Button>
										<Button variant="outline" size="sm" onclick={addModule}>
											<Plus class="h-4 w-4" />
											Add Module
										</Button>
									</div>
								</div>

								<div class="grid gap-4 overflow-y-auto px-1 pt-4 pb-4 md:grid-cols-2">
									{#each modules as module, moduleIndex (module.id)}
										<ModuleCard
											{module}
											{moduleIndex}
											canRemove={modules.length > 1}
											onRemove={() => removeModuleHandler(moduleIndex)}
											onUpdateEffect={(effectIndex, field, value) =>
												updateEffect(moduleIndex, effectIndex, field, value)}
										/>
									{/each}
								</div>
							</div>

							<div class="space-y-4">
								<SettingsPanel
									{numSlots}
									{priorityEffects}
									{canCalculate}
									{isCalculating}
									{validModulesCount}
									onSlotsChange={(value) => {
										numSlots = value;
										modulesOptimizerStore.setNumSlots(numSlots);
									}}
									onCalculate={calculateOptimalSetup}
									onManagePriorities={() => (activeTab = 'priorities')}
								/>
							</div>
						</div>
					</Tabs.Content>

					<Tabs.Content value="priorities" class="space-y-6">
						<PriorityManager
							{priorityEffects}
							onToggle={togglePriorityEffect}
							onMove={movePriorityEffect}
						/>
					</Tabs.Content>

					<Tabs.Content value="results" class="space-y-6">
						<ResultsDisplay {result} />
					</Tabs.Content>
				</Tabs.Root>
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>

	<Dialog.Root bind:open={showClearDialog}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Clear All Modules?</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to clear all your modules? This action cannot be undone.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (showClearDialog = false)}>No</Button>
				<Button variant="destructive" onclick={clearAll}>Yes, Clear All</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	{#snippet failed(error, reset)}
		<ErrorBoundary {error} {reset} />
	{/snippet}
</svelte:boundary>
