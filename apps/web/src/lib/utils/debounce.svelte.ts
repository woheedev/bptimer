/**
 * Debounce utility for delaying function execution
 * Useful for search inputs, auto-save, and other scenarios where you want to wait
 * for the user to stop typing before executing an action
 */

import { DEBOUNCE_DELAY } from '$lib/constants';

/**
 * Creates a debounced version of a function
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns A debounced version of the function with an execute method
 */
export function debounce<T extends (...args: never[]) => void>(
	fn: T,
	delay: number = DEBOUNCE_DELAY
): { execute: T } {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return {
		execute: ((...args: Parameters<T>) => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			timeoutId = setTimeout(() => {
				fn(...args);
			}, delay);
		}) as T
	};
}

/**
 * Creates a debounced state setter
 * Useful for creating reactive debounced values in Svelte components
 * @param initialValue - The initial value of the state
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns An object with current value and a debounced setter
 */
export function createDebouncedState<T>(initialValue: T, delay: number = DEBOUNCE_DELAY) {
	let value = $state(initialValue);
	const setter = debounce((newValue: T) => {
		value = newValue;
	}, delay);

	return {
		get value() {
			return value;
		},
		set: setter.execute
	};
}
