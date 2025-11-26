# @woheedev/bptimer-api-client

Simple API client for submitting boss HP data to bptimer.com.

## Installation

```bash
npm install @woheedev/bptimer-api-client
```

## Usage

```typescript
import { BPTimerClient } from '@woheedev/bptimer-api-client';
import dotenv from 'dotenv';

dotenv.config();

// Example loading ENV from .env but you can do it
// however you want to do it that is not hardcoded
const BPTIMER_API_URL = process.env.BPTIMER_API_URL;
const BPTIMER_API_KEY = process.env.BPTIMER_API_KEY;

// Another example if using vite
const BPTIMER_API_URL = import.meta.env.VITE_BPTIMER_API_URL;
const BPTIMER_API_KEY = import.meta.env.VITE_BPTIMER_API_KEY;

// Initialize once at startup (don't call this in a loop!)
const bptimer = new BPTimerClient({
  api_url: BPTIMER_API_URL,
  api_key: BPTIMER_API_KEY
});

// Call inline wherever you get boss HP updates
await bptimer.reportHP({
  monster_id,
  hp_pct,
  line,
  pos_x,
  pos_y,
  pos_z,
  account_id, // used for region detection (comes from local player state)
  uid // future implementation for linking users to their website account (comes from local player state)
});

// Map variables with different names to property names
await bptimer.reportHP({
  monster_id: mobId,
  hp_pct: hpPercentage,
  line: channelNumber
  // ... the rest of the fields
});

// Optional helpers
await bptimer.testConnection(); // Check connection to api_url with api_key
bptimer.setEnabled(false); // Disable reporting
bptimer.resetMonster(monster_id, line); // Force reset cache
bptimer.clearAll(); // Clear all cache
```

## Custom Logging

By default, the client uses `console` for logging. You can provide your own logger object with `info` and `debug` methods, and control what gets logged via `log_level`.

```typescript
// Using your existing logger
this.bpTimerClient = new BPTimerClient({
  api_url: DB_URL,
  api_key: API_KEY,
  logger: {
    info: (message: string) => this.logger.info(message),
    debug: (message: string) => this.logger.debug(message)
  },
  log_level: 'info'
});
```
