import { browser } from '$app/environment';
import {
	DEBOUNCE_DELAY,
	MODULES_OPTIMIZER_MODULES_STORAGE_KEY,
	MODULES_OPTIMIZER_NUM_SLOTS_STORAGE_KEY,
	MODULES_OPTIMIZER_PRIORITY_EFFECTS_STORAGE_KEY,
	MODULE_DEFAULT_NAME_PREFIX
} from '$lib/constants';
import type { Module } from '$lib/schemas';
import { debounce } from '$lib/utils/debounce.svelte';
import { createEmptyModule } from '$lib/utils/modules';

function loadModulesFromLocalStorage(): Module[] {
	if (!browser) return [createEmptyModule(`${MODULE_DEFAULT_NAME_PREFIX} 1`)];
	try {
		const stored = localStorage.getItem(MODULES_OPTIMIZER_MODULES_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.length > 0 ? parsed : [createEmptyModule(`${MODULE_DEFAULT_NAME_PREFIX} 1`)];
		}
	} catch (error) {
		console.error('Failed to load modules from localStorage:', error);
	}
	return [createEmptyModule(`${MODULE_DEFAULT_NAME_PREFIX} 1`)];
}

function loadPriorityEffectsFromLocalStorage(): string[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(MODULES_OPTIMIZER_PRIORITY_EFFECTS_STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error('Failed to load priority effects from localStorage:', error);
	}
	return [];
}

function loadNumSlotsFromLocalStorage(): string {
	if (!browser) return '2';
	try {
		const stored = localStorage.getItem(MODULES_OPTIMIZER_NUM_SLOTS_STORAGE_KEY);
		if (stored) {
			return stored;
		}
	} catch (error) {
		console.error('Failed to load num slots from localStorage:', error);
	}
	return '2';
}

function saveModulesToLocalStorage(modules: Module[]) {
	if (!browser) return;
	try {
		localStorage.setItem(MODULES_OPTIMIZER_MODULES_STORAGE_KEY, JSON.stringify(modules));
	} catch (error) {
		console.error('Failed to save modules to localStorage:', error);
	}
}

function savePriorityEffectsToLocalStorage(priorityEffects: string[]) {
	if (!browser) return;
	try {
		localStorage.setItem(
			MODULES_OPTIMIZER_PRIORITY_EFFECTS_STORAGE_KEY,
			JSON.stringify(priorityEffects)
		);
	} catch (error) {
		console.error('Failed to save priority effects to localStorage:', error);
	}
}

function saveNumSlotsToLocalStorage(numSlots: string) {
	if (!browser) return;
	try {
		localStorage.setItem(MODULES_OPTIMIZER_NUM_SLOTS_STORAGE_KEY, numSlots);
	} catch (error) {
		console.error('Failed to save num slots to localStorage:', error);
	}
}

function createModulesOptimizerStore() {
	let modules = $state<Module[]>(loadModulesFromLocalStorage());
	let priorityEffects = $state<string[]>(loadPriorityEffectsFromLocalStorage());
	let numSlots = $state<string>(loadNumSlotsFromLocalStorage());

	const debouncedSaveModules = debounce((modulesToSave: Module[]) => {
		saveModulesToLocalStorage(modulesToSave);
	}, DEBOUNCE_DELAY);

	function setModules(newModules: Module[]) {
		modules = newModules;
		debouncedSaveModules.execute(newModules);
	}

	function setPriorityEffects(newPriorityEffects: string[]) {
		priorityEffects = newPriorityEffects;
		savePriorityEffectsToLocalStorage(newPriorityEffects);
	}

	function setNumSlots(newNumSlots: string) {
		numSlots = newNumSlots;
		saveNumSlotsToLocalStorage(newNumSlots);
	}

	function clearAll() {
		modules = [createEmptyModule(`${MODULE_DEFAULT_NAME_PREFIX} 1`)];
		priorityEffects = [];
		numSlots = '2';
		saveModulesToLocalStorage(modules);
		savePriorityEffectsToLocalStorage(priorityEffects);
		saveNumSlotsToLocalStorage(numSlots);
	}

	return {
		get modules() {
			return modules;
		},
		get priorityEffects() {
			return priorityEffects;
		},
		get numSlots() {
			return numSlots;
		},
		setModules,
		setPriorityEffects,
		setNumSlots,
		clearAll
	};
}

export const modulesOptimizerStore = createModulesOptimizerStore();
