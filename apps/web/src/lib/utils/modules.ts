import {
	getEffectNames,
	MODULE_DEFAULT_NAME_PREFIX,
	MODULE_OPTIMIZER_GREEDY_CANDIDATE_LIMIT,
	MODULE_OPTIMIZER_LOCAL_SEARCH_MAX_ITERATIONS,
	MODULE_OPTIMIZER_LOCAL_SEARCH_MIN_RELEVANT_MODULES,
	MODULE_OPTIMIZER_LOCAL_SEARCH_SAMPLE_SIZE,
	MODULE_OPTIMIZER_MAX_ATTEMPTS_MULTIPLIER,
	MODULE_OPTIMIZER_MAX_MODULES_FOR_FULL_SEARCH,
	MODULE_OPTIMIZER_MAX_SOLUTIONS,
	MODULE_OPTIMIZER_PREFILTER_TOP_PER_ATTR,
	MODULE_OPTIMIZER_YIELD_INTERVAL,
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
 * Calculates score for a module combination based on effect levels and priorities
 */
export function calculateScore(combination: Module[], priorityEffects: string[]): number {
	const combinedEffects = getCombinedEffects(combination);
	let totalScore = 0;

	const priorityLookup = new Map<string, number>();
	priorityEffects.forEach((effect, index) => {
		if (index < MODULE_PRIORITY_MULTIPLIERS.length) {
			priorityLookup.set(effect, MODULE_PRIORITY_MULTIPLIERS[index]);
		}
	});

	for (const effectName in combinedEffects) {
		const level = combinedEffects[effectName];
		let effectScore = getScoreByLevel(level);

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

function prefilterModules(modules: Module[], topPerAttr: number): Module[] {
	const attrModules = new Map<string, Array<{ module: Module; value: number }>>();

	for (const module of modules) {
		for (const effect of module.effects) {
			if (effect.name && effect.level > 0) {
				if (!attrModules.has(effect.name)) {
					attrModules.set(effect.name, []);
				}
				attrModules.get(effect.name)!.push({ module, value: effect.level });
			}
		}
	}

	const candidates = new Set<Module>();
	for (const [, moduleList] of attrModules) {
		const top = moduleList
			.sort((a, b) => b.value - a.value)
			.slice(0, topPerAttr)
			.map((item) => item.module);
		for (const module of top) {
			candidates.add(module);
		}
	}

	return Array.from(candidates);
}

function greedyConstructSolution(
	modules: Module[],
	numSlots: number,
	priorityEffects: string[]
): Module[] {
	if (modules.length < numSlots) return [];

	const prioritySet = new Set(priorityEffects);
	const scoredModules = modules.map((module) => {
		let score = 0;
		for (const effect of module.effects) {
			if (effect.name && effect.level > 0 && prioritySet.has(effect.name)) {
				const priorityIndex = priorityEffects.indexOf(effect.name);
				const multiplier = MODULE_PRIORITY_MULTIPLIERS[priorityIndex] || 1;
				score += effect.level * multiplier;
			}
		}
		return { module, score };
	});
	scoredModules.sort((a, b) => b.score - a.score);

	const candidateModules = scoredModules
		.slice(0, Math.min(MODULE_OPTIMIZER_GREEDY_CANDIDATE_LIMIT, modules.length))
		.map((item) => item.module);

	const current = [candidateModules[Math.floor(Math.random() * candidateModules.length)]];

	for (let k = 0; k < numSlots - 1; k++) {
		let bestModule: Module | null = null;
		let bestScore = -Infinity;

		for (const module of candidateModules) {
			if (current.includes(module)) continue;

			const test = [...current, module];
			const score = calculateScore(test, priorityEffects);

			if (score > bestScore) {
				bestScore = score;
				bestModule = module;
			}
		}

		if (bestModule === null) break;
		current.push(bestModule);
	}

	return current.length === numSlots ? current : [];
}

function localSearchImprove(
	solution: Module[],
	allModules: Module[],
	priorityEffects: string[],
	maxIterations: number
): Module[] {
	let best = [...solution];
	let bestScore = calculateScore(best, priorityEffects);

	const prioritySet = new Set(priorityEffects);
	const relevantModules = allModules.filter((module) => {
		if (best.includes(module)) return false;
		for (const effect of module.effects) {
			if (effect.name && effect.level > 0 && prioritySet.has(effect.name)) {
				return true;
			}
		}
		return false;
	});

	const candidateModules =
		relevantModules.length >= MODULE_OPTIMIZER_LOCAL_SEARCH_MIN_RELEVANT_MODULES
			? relevantModules
			: allModules;

	for (let iter = 0; iter < maxIterations; iter++) {
		let improved = false;

		for (let i = 0; i < best.length; i++) {
			const sampleSize = Math.min(
				MODULE_OPTIMIZER_LOCAL_SEARCH_SAMPLE_SIZE,
				candidateModules.length
			);
			const sample = candidateModules
				.filter((m) => !best.includes(m))
				.sort(() => Math.random() - 0.5)
				.slice(0, sampleSize);

			for (const newModule of sample) {
				const newSolution = [...best];
				newSolution[i] = newModule;

				const newScore = calculateScore(newSolution, priorityEffects);
				if (newScore > bestScore) {
					best = newSolution;
					bestScore = newScore;
					improved = true;
					break;
				}
			}
			if (improved) break;
		}

		if (!improved && iter > maxIterations / 2) break;
	}

	return best;
}

/**
 * Finds the optimal module combination for the given parameters
 */
export async function findOptimalSetup(
	modules: Module[],
	numSlots: number,
	priorityEffects: string[]
): Promise<OptimizationResult> {
	let validModules = getValidModules(modules);

	if (validModules.length < numSlots) {
		throw new Error(`You need at least ${numSlots} modules with effects to calculate.`);
	}

	if (validModules.length > MODULE_OPTIMIZER_MAX_MODULES_FOR_FULL_SEARCH) {
		validModules = prefilterModules(validModules, MODULE_OPTIMIZER_PREFILTER_TOP_PER_ATTR);
	}

	if (validModules.length < numSlots) {
		throw new Error(`Not enough modules after filtering.`);
	}

	const MAX_ATTEMPTS = MODULE_OPTIMIZER_MAX_SOLUTIONS * MODULE_OPTIMIZER_MAX_ATTEMPTS_MULTIPLIER;
	const seen = new Set<string>();
	const solutions: Array<{ modules: Module[]; score: number }> = [];

	let attempts = 0;

	while (solutions.length < MODULE_OPTIMIZER_MAX_SOLUTIONS && attempts < MAX_ATTEMPTS) {
		attempts++;

		const initial = greedyConstructSolution(validModules, numSlots, priorityEffects);
		if (initial.length === 0) continue;

		const improved = localSearchImprove(
			initial,
			validModules,
			priorityEffects,
			MODULE_OPTIMIZER_LOCAL_SEARCH_MAX_ITERATIONS
		);

		const key = improved
			.map((m) => m.id)
			.sort()
			.join('|');

		if (seen.has(key)) continue;
		seen.add(key);

		const score = calculateScore(improved, priorityEffects);
		solutions.push({ modules: improved, score });

		if (attempts % MODULE_OPTIMIZER_YIELD_INTERVAL === 0) {
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
	}

	if (solutions.length === 0) {
		throw new Error('No valid combination found.');
	}

	solutions.sort((a, b) => b.score - a.score);
	const best = solutions[0];

	const combinedEffects = getCombinedEffects(best.modules);
	const prioritizedEffects: Record<string, number> = {};

	Object.entries(combinedEffects).forEach(([effect, level]) => {
		if (priorityEffects.includes(effect)) {
			prioritizedEffects[effect] = level;
		}
	});

	return {
		totalScore: best.score,
		optimalModules: best.modules,
		combinedEffects,
		prioritizedEffects
	};
}

/**
 * Creates a new empty module with the given ID
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
	const allEffects = getEffectNames();
	return allEffects.filter((effect) => !priorityEffects.includes(effect));
}
