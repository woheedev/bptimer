/// <reference path="../pb_data/types.d.ts" />

/**
 * Enable gzip compression for all HTTP responses
 */

routerUse($apis.gzip());

console.log('[Compression] Gzip compression middleware enabled for all routes');
