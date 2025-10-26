import sharedConfig from '@repo/eslint-config';

export default [
	...sharedConfig,
	{
		// Add any app-specific overrides here
		rules: {
			// Example: override shared rules for this app
		}
	},
	{
		ignores: [
			'src/lib/hooks/is-mobile.svelte.ts', // MediaQuery class extension
			'src/lib/components/ui/sidebar/context.svelte.ts', // Getter type syntax
			'src/lib/utils/debounce.svelte.ts', // Generic type parameters
			'src/lib/utils/search.svelte.ts', // Generic types with $state/$effect
			'src/lib/components/navigation/main.svelte' // Missing resolve
		]
	}
];
