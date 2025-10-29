import { PUBLIC_POCKETBASE_BASE_URL } from '$env/static/public';
import PocketBase from 'pocketbase';

// Main PocketBase client for HTTP requests
// Keep auto-cancellation enabled (default) to prevent memory leaks
export const pb = new PocketBase(PUBLIC_POCKETBASE_BASE_URL);

// Separate PocketBase client for realtime SSE subscriptions
// Auto-cancellation disabled because SSE connections must stay open
export const pbRealtime = new PocketBase(PUBLIC_POCKETBASE_BASE_URL);
pbRealtime.autoCancellation(false);
