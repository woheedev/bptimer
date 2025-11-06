# @repo/bptimer-api-client

Simple API client for submitting boss HP data to bptimer.com.

## Usage

```typescript
import { BPTimerClient } from '@repo/bptimer-api-client';

// Initialize once at startup (don't call this in a loop!)
const bptimer = new BPTimerClient({
  api_url: 'https://db.bptimer.com',
  api_key: 'your-api-key'
});

// Call inline wherever you get boss HP updates
await bptimer.reportHP(monster_id, hp_pct, line);

// With optional parameters (not yet implemented on backend)
await bptimer.reportHP(monster_id, hp_pct, line, {
  pos_x: 123.45,
  pos_y: 678.9,
  region: 'NA'
});

// Optional helpers
bptimer.setEnabled(false); // Disable reporting
bptimer.resetMonster(monster_id, line); // Force reset cache
bptimer.clearAll(); // Clear all cache
```
