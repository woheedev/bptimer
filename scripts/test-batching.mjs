const TEST_CONFIGS = {
  burst: {
    reports: 100,
    delayMs: 5,
    mobs: [
      { id: 10007, name: 'Storm Goblin King', channels: 10 },
      { id: 10009, name: 'Frost Ogre', channels: 10 },
      { id: 10018, name: 'Inferno Ogre', channels: 10 },
      { id: 10029, name: 'Muku King', channels: 10 },
      { id: 10032, name: 'Golden Juggernaut', channels: 10 }
    ]
  },
  stress: {
    reports: 500,
    delayMs: 10,
    mobs: [
      { id: 10007, name: 'Storm Goblin King', channels: 10 },
      { id: 10009, name: 'Frost Ogre', channels: 10 },
      { id: 10010, name: 'Tempest Ogre', channels: 10 },
      { id: 10018, name: 'Inferno Ogre', channels: 10 },
      { id: 10029, name: 'Muku King', channels: 10 },
      { id: 10032, name: 'Golden Juggernaut', channels: 10 },
      { id: 10056, name: 'Brigand Leader', channels: 10 },
      { id: 10069, name: 'Phantom Arachnocrab', channels: 10 },
      { id: 10081, name: 'Iron Fang', channels: 10 }
    ]
  },
  endurance: {
    reports: 2500,
    delayMs: 12,
    mobs: [
      { id: 10007, name: 'Storm Goblin King', channels: 10 },
      { id: 10009, name: 'Frost Ogre', channels: 10 },
      { id: 10018, name: 'Inferno Ogre', channels: 10 },
      { id: 10029, name: 'Muku King', channels: 10 },
      { id: 10032, name: 'Golden Juggernaut', channels: 10 }
    ]
  }
};

class BPTimer {
  constructor(apiKey, dbURL) {
    this.dbURL = dbURL;
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const url = `${this.dbURL}${endpoint}`;
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    };

    return fetch(url, { ...options, headers });
  }

  async createHpReport(monsterId, hpPct, line) {
    const payload = {
      monster_id: monsterId,
      hp_pct: hpPct,
      line: line
    };

    const response = await this.request('/api/create-hp-report', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${response.status} - ${error.message || JSON.stringify(error)}`);
    }

    return await response.json();
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function runTest(app, config) {
  const totalChannels = config.mobs.reduce((sum, mob) => sum + mob.channels, 0);

  console.log(
    `Reports: ${config.reports}, Delay: ${config.delayMs}ms, Mobs: ${config.mobs.length}, Channels: ${totalChannels}`
  );

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };

  const channelHP = new Map();
  const mobChannelIndex = new Map();
  config.mobs.forEach((mob) => mobChannelIndex.set(mob.id, 0));

  const getChannelKey = (mobId, channel) => `${mobId}_${channel}`;

  const getNextHP = (mobId, channel) => {
    const key = getChannelKey(mobId, channel);

    if (!channelHP.has(key)) {
      const startingHP = 99 - (channel - 1);
      channelHP.set(key, startingHP);
    }

    const currentHP = channelHP.get(key);
    if (currentHP <= 0) return 0;

    const nextHP = Math.max(0, currentHP - 1);
    channelHP.set(key, nextHP);
    return nextHP;
  };

  const startTime = Date.now();

  for (let i = 0; i < config.reports; i++) {
    results.total++;

    const mob = config.mobs[i % config.mobs.length];
    const channelIndex = mobChannelIndex.get(mob.id);
    const channel = (channelIndex % mob.channels) + 1;
    mobChannelIndex.set(mob.id, channelIndex + 1);
    const hpPct = getNextHP(mob.id, channel);

    if ((i + 1) % Math.ceil(config.reports / 10) === 0) {
      const percent = Math.round(((i + 1) / config.reports) * 100);
      process.stdout.write(`\r[${percent}%] ${i + 1}/${config.reports} sent...`);
    }

    try {
      await app.createHpReport(mob.id, hpPct, channel);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        report: i + 1,
        error: error.message
      });
    }

    if (config.delayMs > 0 && i < config.reports - 1) {
      await sleep(config.delayMs);
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  process.stdout.write('\r' + ' '.repeat(60) + '\r');

  console.log(`\nResults:`);
  console.log(
    `Total: ${results.total}, Success: ${results.success} (${((results.success / results.total) * 100).toFixed(1)}%), Failed: ${results.failed}`
  );
  console.log(
    `Duration: ${duration.toFixed(2)}s, Req/s: ${(results.total / duration).toFixed(2)}, Avg latency: ${((duration / results.total) * 1000).toFixed(2)}ms`
  );

  const expectedBatches = Math.ceil(duration / 0.2);
  const reportsPerBatch = Math.ceil(results.total / expectedBatches);
  console.log(
    `Expected batches: ~${expectedBatches}, Per batch: ~${reportsPerBatch}, Reduction: ~${((1 - expectedBatches / results.total) * 100).toFixed(1)}%`
  );

  if (results.errors.length > 0) {
    console.log(`\nErrors (first 5 of ${results.errors.length}):`);
    results.errors.slice(0, 5).forEach(({ report, error }) => {
      console.log(`  #${report}: ${error}`);
    });
  }

  return results;
}

async function main() {
  const [dbURL, apiKey, testMode = 'endurance'] = process.argv.slice(2);

  if (!dbURL || !apiKey) {
    console.error('Usage: bun test-batching.mjs <db_url> <api_key> [test_mode]\n');
    console.error('Test Modes: burst, stress, endurance');
    process.exit(1);
  }

  const config = TEST_CONFIGS[testMode];
  if (!config) {
    console.error(`Unknown test mode: ${testMode}`);
    console.error('Valid modes:', Object.keys(TEST_CONFIGS).join(', '));
    process.exit(1);
  }

  const app = new BPTimer(apiKey, dbURL);

  console.log(`Mode: ${testMode}`);

  try {
    const results = await runTest(app, config);
    process.exit(results.failed > results.total * 0.1 ? 1 : 0);
  } catch (error) {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  }
}

main();
