const DB_URL = 'http://localhost:8090';
const MONSTER_ID = 10904; // Loyal Boarlet
const HP_PCT = 100; // HP percentage (0-100)
const LINE = 10; // Line number (1-XXX)
const POS_X = 222; // Loyal Boarlet SCOUT 1 location
const POS_Y = 142;
const POS_Z = 32;
const ACCOUNT_ID = '4_1234567890';
const UID = 1234567890;
const PLAYER_NAME = 'Wohee';
// NA: gamesvr.playbpsr.com | EU: gamesvr-eu.playbpsr.com | SEA: bpm-sea-gamesvra.haoplay.net
// JP: bpm-jp-gamesvra.xdg.com | KR: bpm-kr-gamesvra.xdg.com
const SCENE_IP = 'gamesvr.playbpsr.com';

class BPTimer {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // API request handler
  async request(endpoint, options = {}) {
    const url = `${DB_URL}${endpoint}`;
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    };

    return fetch(url, { ...options, headers });
  }

  // Create HP report
  async createHpReport(
    monsterId,
    hpPct,
    line,
    posX,
    posY,
    posZ,
    accountId,
    uid,
    playerName,
    sceneIp
  ) {
    try {
      const payload = {
        monster_id: monsterId,
        hp_pct: hpPct,
        line: line
      };

      if (posX !== undefined && posY !== undefined && posZ !== undefined) {
        payload.pos_x = posX;
        payload.pos_y = posY;
        payload.pos_z = posZ;
      }

      if (accountId !== undefined) {
        payload.account_id = accountId;
      }

      if (uid !== undefined) {
        payload.uid = uid;
      }

      if (playerName !== undefined) {
        payload.player_name = playerName;
      }

      if (sceneIp !== undefined) {
        payload.scene_ip = sceneIp;
      }

      const response = await this.request('/api/create-hp-report', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${response.status} - ${error.message || error}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

const [apiKey, lineArg, sceneIpArg] = process.argv.slice(2);

if (!apiKey) {
  console.error('Usage: bun create-hp-report.mjs <api_key> [line] [scene_ip]');
  process.exit(1);
}

// Optional overrides
const line = lineArg !== undefined ? parseInt(lineArg, 10) : LINE;
const sceneIp = sceneIpArg ?? SCENE_IP;

const app = new BPTimer(apiKey);

try {
  const result = await app.createHpReport(
    MONSTER_ID,
    HP_PCT,
    line,
    POS_X,
    POS_Y,
    POS_Z,
    ACCOUNT_ID,
    UID,
    PLAYER_NAME,
    sceneIp
  );
  console.log('HP Report created successfully:', result);
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
