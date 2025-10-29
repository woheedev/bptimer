/// <reference path="../pb_data/types.d.ts" />

/**
 * Create HP Report Endpoint
 *
 * POST /api/create-hp-report
 *
 * Request body:
 * {
 *   monster_id: number - Boss meter ID (From game)
 *   hp_pct: number - HP percentage (0-100)
 *   line: number - Channel number (1-1000)
 * }
 *
 * Requires X-API-Key header for authentication
 */
routerAdd(
  'POST',
  '/api/create-hp-report',
  (e) => {
    try {
      // Temp inline boss game id to boss name mapping
      const BOSS_MAPPING = {
        80006: 'Golden Juggernaut',
        10032: 'Golden Juggernaut',
        108: 'Frost Ogre',
        10009: 'Frost Ogre',
        20100: 'Frost Ogre',
        20127: 'Frost Ogre',
        80002: 'Frost Ogre',
        2000129: 'Frost Ogre',
        2000140: 'Frost Ogre',
        2004172: 'Frost Ogre',
        3000006: 'Frost Ogre',
        3000019: 'Frost Ogre',
        80004: 'Inferno Ogre',
        10018: 'Inferno Ogre',
        80008: 'Phantom Arachnocrab',
        10069: 'Phantom Arachnocrab',
        10056: 'Brigand Leader',
        80009: 'Venobzzar Incubator',
        10077: 'Venobzzar Incubator',
        3000025: 'Venobzzar Incubator',
        80007: 'Muku Chief',
        10059: 'Muku Chief',
        3000022: 'Muku Chief',
        8611: 'Iron Fang',
        80010: 'Iron Fang',
        10081: 'Iron Fang',
        3000024: 'Iron Fang',
        80001: 'Storm Goblin King',
        10007: 'Storm Goblin King',
        61219: 'Storm Goblin King',
        61220: 'Storm Goblin King',
        61221: 'Storm Goblin King',
        4301: 'Tempest Ogre',
        10010: 'Tempest Ogre',
        20024: 'Tempest Ogre',
        20072: 'Tempest Ogre',
        20092: 'Tempest Ogre',
        80003: 'Tempest Ogre',
        2000131: 'Tempest Ogre',
        2000137: 'Tempest Ogre',
        3000001: 'Tempest Ogre',
        3000020: 'Tempest Ogre',
        530354: 'Tempest Ogre',
        10084: 'Celestial Flier',
        3000038: 'Celestial Flier',
        10085: 'Lizardman King',
        3000036: 'Lizardman King',
        8070: 'Goblin King',
        203: 'Goblin King',
        204: 'Goblin King',
        1400: 'Goblin King',
        1410: 'Goblin King',
        1413: 'Goblin King',
        10086: 'Goblin King',
        20028: 'Goblin King',
        20070: 'Goblin King',
        20107: 'Goblin King',
        60416: 'Goblin King',
        552020: 'Goblin King',
        612401: 'Goblin King',
        7700001: 'Goblin King',
        2000134: 'Goblin King',
        2000138: 'Goblin King',
        2004164: 'Goblin King',
        2004169: 'Goblin King',
        3000021: 'Goblin King',
        10029: 'Muku King',
        20027: 'Muku King',
        20071: 'Muku King',
        20108: 'Muku King',
        80005: 'Muku King',
        81000: 'Muku King',
        3000008: 'Muku King',
        10902: 'Lovely Boarlet',
        10903: 'Breezy Boarlet',
        10904: 'Loyal Boarlet',
        10900: 'Golden Nappo',
        10901: 'Silver Nappo'
      };

      const data = new DynamicModel({
        monster_id: 0,
        hp_pct: 0,
        line: 0
      });

      e.bindBody(data);

      const monsterId = data.monster_id;
      const hpPct = data.hp_pct;
      const line = data.line;

      // Validate required fields
      if (!monsterId) {
        throw new BadRequestError('Missing or invalid monster_id');
      }
      if (hpPct === undefined || hpPct === null) {
        throw new BadRequestError('Missing hp_pct');
      }
      if (!line) {
        throw new BadRequestError('Missing line');
      }

      if (hpPct < 0 || hpPct > 100) {
        throw new BadRequestError('HP percentage must be between 0 and 100');
      }

      if (line < 1 || line > 1000) {
        throw new BadRequestError('Channel number must be between 1 and 1000');
      }

      // Lookup boss name from mapping
      const bossName = BOSS_MAPPING[monsterId];
      if (!bossName) {
        throw new BadRequestError(`Unknown monster ID: ${monsterId}`);
      }

      // Find mob record by name in db
      const boss = e.app.findFirstRecordByFilter('mobs', `name = "${bossName}"`);
      if (!boss) {
        throw new NotFoundError(`Boss '${bossName}' not found in database`);
      }

      const mapId = boss.get('map');

      // Get map record for channel validation
      const map = e.app.findRecordById('maps', mapId);
      if (!map) {
        throw new NotFoundError('Map not found for this boss');
      }

      // Validate channel number against map's total channels
      const totalChannels = map.get('total_channels');
      if (line > totalChannels) {
        throw new BadRequestError(`Channel must be between 1 and ${totalChannels} for this boss`);
      }

      // Submit HP report
      const collection = e.app.findCollectionByNameOrId('hp_reports');
      const hpReport = new Record(collection, {
        mob: boss.id,
        channel_number: line,
        hp_percentage: hpPct,
        reporter: e.auth.id
      });

      e.app.save(hpReport);

      return e.json(200, { success: true });
    } catch (error) {
      console.error('[HP Report] Error:', error.message, error);
      throw error;
    }
  },
  $apis.requireAuth()
);
