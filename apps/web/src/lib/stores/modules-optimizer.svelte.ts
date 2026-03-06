import { browser } from '$app/environment';
import {
	DEBOUNCE_DELAY,
	MODULE_DEFAULT_NAME_PREFIX,
	MODULE_MAX_STAT_LEVEL,
	MODULE_PRIORITY_MULTIPLIERS,
	MODULE_WEIGHT_MAX,
	MODULES_OPTIMIZER_EFFECT_MIN_LEVELS_STORAGE_KEY,
	MODULES_OPTIMIZER_EFFECT_WEIGHTS_STORAGE_KEY,
	MODULES_OPTIMIZER_MODULES_STORAGE_KEY,
	MODULES_OPTIMIZER_NUM_SLOTS_STORAGE_KEY,
	MODULES_OPTIMIZER_PRIORITY_EFFECTS_STORAGE_KEY,
	MODULES_OPTIMIZER_VALUE_ALL_STATS_STORAGE_KEY
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

function loadEffectWeightsFromLocalStorage(): number[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(MODULES_OPTIMIZER_EFFECT_WEIGHTS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (!Array.isArray(parsed)) return [];
			return parsed.map((w: number) => Math.min(MODULE_WEIGHT_MAX, Math.max(1, w)));
		}
	} catch (error) {
		console.error('Failed to load effect weights from localStorage:', error);
	}
	return [];
}

function loadEffectMinLevelsFromLocalStorage(): number[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(MODULES_OPTIMIZER_EFFECT_MIN_LEVELS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (!Array.isArray(parsed)) return [];
			return parsed.map((v: number) => Math.min(MODULE_MAX_STAT_LEVEL, Math.max(0, v)));
		}
	} catch (error) {
		console.error('Failed to load effect min levels from localStorage:', error);
	}
	return [];
}

function loadValueAllStatsFromLocalStorage(): boolean {
	if (!browser) return false;
	try {
		const stored = localStorage.getItem(MODULES_OPTIMIZER_VALUE_ALL_STATS_STORAGE_KEY);
		if (stored !== null) return JSON.parse(stored);
	} catch (error) {
		console.error('Failed to load valueAllStats from localStorage:', error);
	}
	return false;
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

function saveEffectWeightsToLocalStorage(effectWeights: number[]) {
	if (!browser) return;
	try {
		localStorage.setItem(
			MODULES_OPTIMIZER_EFFECT_WEIGHTS_STORAGE_KEY,
			JSON.stringify(effectWeights)
		);
	} catch (error) {
		console.error('Failed to save effect weights to localStorage:', error);
	}
}

function saveEffectMinLevelsToLocalStorage(minLevels: number[]) {
	if (!browser) return;
	try {
		localStorage.setItem(
			MODULES_OPTIMIZER_EFFECT_MIN_LEVELS_STORAGE_KEY,
			JSON.stringify(minLevels)
		);
	} catch (error) {
		console.error('Failed to save effect min levels to localStorage:', error);
	}
}

function saveValueAllStatsToLocalStorage(value: boolean) {
	if (!browser) return;
	try {
		localStorage.setItem(MODULES_OPTIMIZER_VALUE_ALL_STATS_STORAGE_KEY, JSON.stringify(value));
	} catch (error) {
		console.error('Failed to save valueAllStats to localStorage:', error);
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
	let effectWeights = $state<number[]>(loadEffectWeightsFromLocalStorage());
	let effectMinLevels = $state<number[]>(loadEffectMinLevelsFromLocalStorage());
	let valueAllStats = $state<boolean>(loadValueAllStatsFromLocalStorage());
	let numSlots = $state<string>(loadNumSlotsFromLocalStorage());

	const debouncedSaveModules = debounce((modulesToSave: Module[]) => {
		saveModulesToLocalStorage(modulesToSave);
	}, DEBOUNCE_DELAY);

	function setModules(newModules: Module[]) {
		modules = newModules;
		debouncedSaveModules.execute(newModules);
	}

	function setPriorityEffects(newPriorityEffects: string[]) {
		effectWeights = realignToEffects(priorityEffects, newPriorityEffects, effectWeights, (i) =>
			Math.min(MODULE_WEIGHT_MAX, Math.max(1, MODULE_PRIORITY_MULTIPLIERS[i] ?? 1))
		);
		effectMinLevels = realignToEffects(
			priorityEffects,
			newPriorityEffects,
			effectMinLevels,
			() => 0
		);
		priorityEffects = newPriorityEffects;
		savePriorityEffectsToLocalStorage(priorityEffects);
		saveEffectWeightsToLocalStorage(effectWeights);
		saveEffectMinLevelsToLocalStorage(effectMinLevels);
	}

	function realignToEffects(
		oldEffects: string[],
		newEffects: string[],
		oldValues: number[],
		defaultFn: (i: number) => number
	): number[] {
		return newEffects.map((effect, i) => {
			const oldIdx = oldEffects.indexOf(effect);
			return oldIdx >= 0 ? oldValues[oldIdx] : defaultFn(i);
		});
	}

	function setEffectWeights(newEffectWeights: number[]) {
		effectWeights = newEffectWeights.map((w) => Math.min(MODULE_WEIGHT_MAX, Math.max(1, w)));
		saveEffectWeightsToLocalStorage(effectWeights);
	}

	function setEffectMinLevels(newMinLevels: number[]) {
		effectMinLevels = newMinLevels.map((v) => Math.min(MODULE_MAX_STAT_LEVEL, Math.max(0, v)));
		saveEffectMinLevelsToLocalStorage(effectMinLevels);
	}

	function setValueAllStats(value: boolean) {
		valueAllStats = value;
		saveValueAllStatsToLocalStorage(value);
	}

	function setNumSlots(newNumSlots: string) {
		numSlots = newNumSlots;
		saveNumSlotsToLocalStorage(newNumSlots);
	}

	function clearAll() {
		modules = [createEmptyModule(`${MODULE_DEFAULT_NAME_PREFIX} 1`)];
		priorityEffects = [];
		effectWeights = [];
		effectMinLevels = [];
		valueAllStats = false;
		numSlots = '2';
		saveModulesToLocalStorage(modules);
		savePriorityEffectsToLocalStorage(priorityEffects);
		saveEffectWeightsToLocalStorage(effectWeights);
		saveEffectMinLevelsToLocalStorage(effectMinLevels);
		saveValueAllStatsToLocalStorage(valueAllStats);
		saveNumSlotsToLocalStorage(numSlots);
	}

	function getEffectWeights(): number[] {
		if (effectWeights.length === priorityEffects.length) {
			return effectWeights;
		}
		return priorityEffects.map((_, i) => MODULE_PRIORITY_MULTIPLIERS[i] ?? 1);
	}

	function getEffectMinLevels(): number[] {
		if (effectMinLevels.length === priorityEffects.length) {
			return effectMinLevels;
		}
		return priorityEffects.map(() => 0);
	}

	return {
		get modules() {
			return modules;
		},
		get priorityEffects() {
			return priorityEffects;
		},
		get effectWeights() {
			return effectWeights;
		},
		get effectMinLevels() {
			return effectMinLevels;
		},
		get valueAllStats() {
			return valueAllStats;
		},
		get numSlots() {
			return numSlots;
		},
		setModules,
		setPriorityEffects,
		setEffectWeights,
		setEffectMinLevels,
		setValueAllStats,
		setNumSlots,
		clearAll,
		getEffectWeights,
		getEffectMinLevels
	};
}

export const modulesOptimizerStore = createModulesOptimizerStore();
