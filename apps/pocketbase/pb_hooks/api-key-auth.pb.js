/// <reference path="../pb_data/types.d.ts" />

/**
 * API Key Authentication Middleware
 *
 * This middleware validates API keys sent via X-API-Key header
 * and authenticates the user. Used by DPS meter.
 */
routerUse((e) => {
  const apiKey = e.request.header.get('X-API-Key');

  if (apiKey) {
    try {
      const apiKeyRecord = e.app.findFirstRecordByData('api_keys', 'api_key', apiKey);
      const user = e.app.findRecordById('users', apiKeyRecord.get('user'));
      e.auth = user;
    } catch (error) {
      throw new UnauthorizedError('Invalid API key');
    }
  }

  return e.next();
});

console.log('[API_KEY] hooks registered');
