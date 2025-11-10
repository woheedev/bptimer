import {
	MODULE_AVAILABLE_EFFECTS,
	MODULE_DEFAULT_NAME_PREFIX,
	MODULE_PRIORITY_MULTIPLIERS,
	MODULE_TIER_THRESHOLDS
} from '$lib/constants';
import type { Module } from '$lib/schemas';
import type { OptimizationResult } from '$lib/types/modules';

function getScoreByLevel(level: number): number {
	for (const { threshold, score } of MODULE_TIER_THRESHOLDS) {
		if (level >= threshold) {
			return score;
		}
	}
	return 0;
}

/**
 * Gets all possible combinations of modules for a given number of slots
 */
export function getCombinations(modules: Module[], k: number): Module[][] {
	const result: Module[][] = [];

	function backtrack(start: number, combo: Module[]) {
		if (combo.length === k) {
			result.push([...combo]);
			return;
		}
		for (let i = start; i < modules.length; i++) {
			combo.push(modules[i]);
			backtrack(i + 1, combo);
			combo.pop();
		}
	}

	backtrack(0, []);
	return result;
}

/**
 * Calculates score for a module combination based on effect levels and priorities
 */
export function calculateScore(combination: Module[], priorityEffects: string[]): number {
	const combinedEffects = getCombinedEffects(combination);
	let totalScore = 0;

	// Create priority lookup map
	const priorityLookup = new Map<string, number>();
	priorityEffects.forEach((effect, index) => {
		if (index < MODULE_PRIORITY_MULTIPLIERS.length) {
			priorityLookup.set(effect, MODULE_PRIORITY_MULTIPLIERS[index]);
		}
	});

	for (const effectName in combinedEffects) {
		const level = combinedEffects[effectName];

		let effectScore = getScoreByLevel(level);

		// Apply priority multiplier
		const multiplier = priorityLookup.get(effectName);
		if (multiplier) {
			effectScore *= multiplier;
		}

		totalScore += effectScore;
	}

	return totalScore;
}

/**
 * Combines effects from multiple modules, summing levels for the same effect
 */
export function getCombinedEffects(combination: Module[]): Record<string, number> {
	const combinedEffects: Record<string, number> = {};

	for (const module of combination) {
		for (const effect of module.effects) {
			if (effect.name && effect.level > 0) {
				combinedEffects[effect.name] = (combinedEffects[effect.name] || 0) + effect.level;
			}
		}
	}

	return combinedEffects;
}

/**
 * Filters out empty modules
 */
export function getValidModules(modules: Module[]): Module[] {
	return modules.filter((module) => {
		for (const effect of module.effects) {
			if (effect.name && effect.level > 0) {
				return true;
			}
		}
		return false;
	});
}

/**
 * Finds the optimal module combination for the given parameters
 */
export function findOptimalSetup(
	modules: Module[],
	numSlots: number,
	priorityEffects: string[]
): OptimizationResult {
	// Filter out empty modules
	const validModules = getValidModules(modules);

	if (validModules.length < numSlots) {
		throw new Error(`You need at least ${numSlots} modules with effects to calculate.`);
	}

	// Get all possible combinations
	const combinations = getCombinations(validModules, numSlots);
	let bestCombination: Module[] = [];
	let maxScore = -1;

	// Find the combination with the highest score
	for (const combination of combinations) {
		const score = calculateScore(combination, priorityEffects);
		if (score > maxScore) {
			maxScore = score;
			bestCombination = combination;
		}
	}

	const combinedEffects = getCombinedEffects(bestCombination);
	const prioritizedEffects: Record<string, number> = {};

	// Extract prioritized effects
	Object.entries(combinedEffects).forEach(([effect, level]) => {
		if (priorityEffects.includes(effect)) {
			prioritizedEffects[effect] = level;
		}
	});

	return {
		totalScore: maxScore,
		optimalModules: bestCombination,
		combinedEffects,
		prioritizedEffects
	};
}

/**
 * Creates a new empty module with the given ID
 * Note: This creates an INVALID module that needs user input before validation
 * Effects 1 & 2 must be filled in by the user (name + level 1-10)
 * Effect 3 is optional (gold modules only, level 1-5)
 */
export function createEmptyModule(id: string): Module {
	return {
		id,
		effects: [
			{ name: '', level: 0 },
			{ name: '', level: 0 },
			{ name: '', level: 0 }
		]
	};
}

/**
 * Updates an effect in a module at the specified indices
 */
export function updateModuleEffect(
	modules: Module[],
	moduleIndex: number,
	effectIndex: number,
	field: 'name' | 'level',
	value: string | number
): Module[] {
	return modules.map((module, i) => {
		if (i !== moduleIndex) return module;

		let effects = [...module.effects];

		// Clear any existing effect with the same name
		if (field === 'name' && typeof value === 'string' && value) {
			effects = effects.map((effect, idx) =>
				idx !== effectIndex && effect.name === value ? { ...effect, name: '' } : effect
			);
		}

		effects[effectIndex] = { ...effects[effectIndex], [field]: value };

		return { ...module, effects: effects as Module['effects'] };
	});
}

/**
 * Removes a module from the modules array and renumbers the remaining modules
 */
export function removeModule(modules: Module[], index: number): Module[] {
	if (modules.length <= 1) return modules;

	const newModules = modules.filter((_, i) => i !== index);
	// Renumber modules
	return newModules.map((module, i) => ({
		...module,
		id: `${MODULE_DEFAULT_NAME_PREFIX} ${i + 1}`
	}));
}

/**
 * Gets available effects that are not in the priority list
 */
export function getAvailableEffects(priorityEffects: string[]): string[] {
	return MODULE_AVAILABLE_EFFECTS.filter((effect) => !priorityEffects.includes(effect));
}
