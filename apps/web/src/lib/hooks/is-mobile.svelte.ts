import { MOBILE_BREAKPOINT } from '$lib/constants';
import { MediaQuery } from 'svelte/reactivity';

export class IsMobile extends MediaQuery {
	constructor(breakpoint: number = MOBILE_BREAKPOINT) {
		super(`max-width: ${breakpoint - 1}px`);
	}
}
