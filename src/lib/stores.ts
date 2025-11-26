import { writable } from 'svelte/store';

/**
 * Stores the opacity of the header background, calculated from scroll position.
 * Value is between 0 (transparent) and 1 (opaque).
 */
export const headerOpacity = writable(0);