class PocketBaseAdmin {
  constructor(dbURL) {
    this.dbURL = dbURL;
    this.authToken = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.dbURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = this.authToken;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`${response.status} - ${error.message || JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async loginAsAdmin(email, password) {
    try {
      const result = await this.request('/api/collections/_superusers/auth-with-password', {
        method: 'POST',
        body: JSON.stringify({ identity: email, password })
      });

      this.authToken = result.token;
      console.log('Authenticated as superuser');
      return result;
    } catch (error) {
      throw new Error(`Superuser login failed: ${error.message}`);
    }
  }

  async deleteAllHPReports() {
    if (!this.authToken) {
      throw new Error('Not authenticated.');
    }

    try {
      console.log('\nDeleting all HP reports...');

      let deleted = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.request(`/api/collections/hp_reports/records?perPage=500&page=1`);

        if (result.items.length === 0) break;

        for (const report of result.items) {
          try {
            await this.request(`/api/collections/hp_reports/records/${report.id}`, {
              method: 'DELETE'
            });
            deleted++;

            if (deleted % 100 === 0) {
              process.stdout.write(`\rDeleted ${deleted} reports...`);
            }
          } catch (error) {
            console.error(`\nFailed to delete report ${report.id}: ${error.message}`);
          }
        }

        hasMore = result.items.length === 500;
      }

      process.stdout.write('\r' + ' '.repeat(50) + '\r');

      if (deleted === 0) {
        console.log('No reports to delete');
      } else {
        console.log(`Deleted ${deleted} HP reports`);
      }

      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete HP reports: ${error.message}`);
    }
  }

  async resetAllMobsToFullHP() {
    if (!this.authToken) {
      throw new Error('Not authenticated.');
    }

    try {
      console.log('Fetching mob channel status records...');

      const result = await this.request('/api/collections/mob_channel_status/records?perPage=500');
      const records = result.items;

      if (records.length === 0) {
        console.log('No records found');
        return { updated: 0, skipped: 0 };
      }

      console.log(`Found ${records.length} records\n`);

      let updated = 0;
      let skipped = 0;
      let failed = 0;

      for (const record of records) {
        if (record.last_hp === 100) {
          skipped++;
          continue;
        }

        try {
          await this.request(`/api/collections/mob_channel_status/records/${record.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ last_hp: 100 })
          });
          updated++;
        } catch (error) {
          failed++;
        }
      }

      console.log(`Reset completed`);
      console.log(
        `Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}, Total: ${records.length}`
      );

      return { updated, skipped, failed };
    } catch (error) {
      throw new Error(`Failed to reset mobs: ${error.message}`);
    }
  }
}

async function main() {
  const [dbURL, adminEmail, adminPassword] = process.argv.slice(2);

  if (!dbURL || !adminEmail || !adminPassword) {
    console.error('Usage: bun clear-test-data.mjs <db_url> <admin_email> <admin_password>\n');
    console.error('Example:');
    console.error('  bun clear-test-data.mjs http://localhost:8090 admin@example.com password123');
    process.exit(1);
  }

  const admin = new PocketBaseAdmin(dbURL);

  try {
    await admin.loginAsAdmin(adminEmail, adminPassword);
    await admin.deleteAllHPReports();
    await admin.resetAllMobsToFullHP();
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main();
