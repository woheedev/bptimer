import type { Writable } from 'svelte/store';
import type { User } from './db';

// Svelte Store Types
export type TokenStore = Writable<string>;
export type UserStore = Writable<User | null>;
