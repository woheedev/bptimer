import type { Module } from '$lib/schemas';

export interface OptimizerOptions {
	effectWeights?: number[];
	effectMinLevels?: number[];
	valueAllStats?: boolean;
}

export interface SingleOptimizationResult {
	totalScore: number;
	optimalModules: Module[];
	combinedEffects: Record<string, number>;
	prioritizedEffects: Record<string, number>;
}

export interface OptimizationResult {
	totalScore: number;
	optimalModules: Module[];
	combinedEffects: Record<string, number>;
	prioritizedEffects: Record<string, number>;
	topResults: SingleOptimizationResult[];
}
