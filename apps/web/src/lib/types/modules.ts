import type { Module } from '$lib/schemas';

export interface OptimizationResult {
	totalScore: number;
	optimalModules: Module[];
	combinedEffects: Record<string, number>;
	prioritizedEffects: Record<string, number>;
}
