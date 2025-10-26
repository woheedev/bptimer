/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    console.log('Setting up initial settings...');

    // Create superuser based on .env
    const adminEmail = $os.getenv('PB_ADMIN_EMAIL');
    const adminPassword = $os.getenv('PB_ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables are required');
    }

    let superusers = app.findCollectionByNameOrId('_superusers');
    let superuserRecord = new Record(superusers);
    superuserRecord.set('email', adminEmail);
    superuserRecord.set('password', adminPassword);
    app.save(superuserRecord);
    console.log('Superuser created.');

    // Configure Discord OAuth settings
    const discordClientId = $os.getenv('PB_OAUTH2_DISCORD_CLIENT_ID');
    const discordClientSecret = $os.getenv('PB_OAUTH2_DISCORD_CLIENT_SECRET');

    if (!discordClientId || !discordClientSecret) {
      throw new Error(
        'PB_OAUTH2_DISCORD_CLIENT_ID and PB_OAUTH2_DISCORD_CLIENT_SECRET environment variables are required'
      );
    }

    const users = app.findCollectionByNameOrId('users');
    users.oauth2 = {
      enabled: true,
      providers: [
        {
          name: 'discord',
          clientId: discordClientId,
          clientSecret: discordClientSecret,
          enabled: true,
          displayName: 'Discord',
          codeChallengeMethod: 'S256',
          authURL: 'https://discord.com/api/oauth2/authorize',
          tokenURL: 'https://discord.com/api/oauth2/token',
          userInfoURL: 'https://discord.com/api/users/@me',
          userInfoFields: {
            id: 'id',
            name: 'username',
            username: 'username',
            avatarURL: 'avatar'
          }
        }
      ]
    };
    app.save(users);
    console.log('Discord OAuth provider configured.');

    // Configure app name if provided
    const appName = $os.getenv('PB_APP_NAME');
    if (appName) {
      let settings = app.settings();
      settings.meta.appName = appName;
      app.save(settings);
      console.log('App name configured.');
    }

    // Configure sender name if provided
    const mailSenderName = $os.getenv('PB_MAIL_SENDER_NAME');
    if (mailSenderName) {
      let settings = app.settings();
      if (!settings.smtp) settings.smtp = {};
      settings.smtp.senderName = mailSenderName;
      app.save(settings);
      console.log('Mail sender name configured.');
    }

    // Configure sender address if provided
    const mailSenderAddress = $os.getenv('PB_MAIL_SENDER_ADDRESS');
    if (mailSenderAddress) {
      let settings = app.settings();
      if (!settings.smtp) settings.smtp = {};
      settings.smtp.senderAddress = mailSenderAddress;
      app.save(settings);
      console.log('Mail sender address configured.');
    }

    // Configure SMTP settings if enabled
    const smtpEnabled = $os.getenv('PB_SMTP_ENABLED');
    if (smtpEnabled === 'true') {
      const smtpHost = $os.getenv('PB_SMTP_HOST');
      const smtpPort = $os.getenv('PB_SMTP_PORT');
      const smtpUsername = $os.getenv('PB_SMTP_USERNAME');
      const smtpPassword = $os.getenv('PB_SMTP_PASSWORD');
      const smtpTls = $os.getenv('PB_SMTP_TLS');
      const smtpAuth = $os.getenv('PB_SMTP_AUTH');

      // Require all SMTP settings if enabled
      if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpTls || !smtpAuth) {
        throw new Error(
          'All SMTP settings must be provided when PB_SMTP_ENABLED is true: PB_SMTP_HOST, PB_SMTP_PORT, PB_SMTP_USERNAME, PB_SMTP_PASSWORD, PB_SMTP_TLS, PB_SMTP_AUTH'
        );
      }

      let settings = app.settings();
      if (!settings.smtp) settings.smtp = {};
      settings.smtp.enabled = true;
      settings.smtp.host = smtpHost;
      settings.smtp.port = parseInt(smtpPort);
      settings.smtp.username = smtpUsername;
      settings.smtp.password = smtpPassword;
      settings.smtp.tls = smtpTls === 'true';
      settings.smtp.auth = smtpAuth;
      app.save(settings);
      console.log('SMTP settings configured.');
    }

    console.log('Initial setup completed.');
  },
  (app) => {
    try {
      let record = app.findAuthRecordByEmail('_superusers', $os.getenv('PB_ADMIN_EMAIL'));
      app.delete(record);
    } catch {
      console.log('Cleanup skipped:', error.message);
    }
  }
);
