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
    const { BOSS_MAPPING } = require(`${__hooks}/constants.js`);

    try {
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
      const boss = e.app.findFirstRecordByFilter('mobs', 'name = {:bossName}', {
        bossName: bossName
      });
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
      console.error(`[HP_REPORT] error:`, error);
      throw error;
    }
  },
  $apis.requireAuth()
);

console.log('[HP_REPORT] hooks registered');
