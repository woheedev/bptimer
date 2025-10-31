/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    console.log('Starting collection creation migration...');
    const snapshot = [
      {
        createRule: null,
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text455797646',
            max: 0,
            min: 0,
            name: 'collectionRef',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text127846527',
            max: 0,
            min: 0,
            name: 'recordRef',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text1582905952',
            max: 0,
            min: 0,
            name: 'method',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            hidden: false,
            id: 'autodate2990389176',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: true,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085495',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: true,
            type: 'autodate'
          }
        ],
        id: 'pbc_2279338944',
        indexes: [
          'CREATE INDEX `idx_mfas_collectionRef_recordRef` ON `_mfas` (collectionRef,recordRef)'
        ],
        listRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
        name: '_mfas',
        system: true,
        type: 'base',
        updateRule: null,
        viewRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
      },
      {
        createRule: null,
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text455797646',
            max: 0,
            min: 0,
            name: 'collectionRef',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text127846527',
            max: 0,
            min: 0,
            name: 'recordRef',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cost: 8,
            hidden: true,
            id: 'password901924565',
            max: 0,
            min: 0,
            name: 'password',
            pattern: '',
            presentable: false,
            required: true,
            system: true,
            type: 'password'
          },
          {
            autogeneratePattern: '',
            hidden: true,
            id: 'text3866985172',
            max: 0,
            min: 0,
            name: 'sentTo',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: true,
            type: 'text'
          },
          {
            hidden: false,
            id: 'autodate2990389176',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: true,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085495',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: true,
            type: 'autodate'
          }
        ],
        id: 'pbc_1638494021',
        indexes: [
          'CREATE INDEX `idx_otps_collectionRef_recordRef` ON `_otps` (collectionRef, recordRef)'
        ],
        listRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
        name: '_otps',
        system: true,
        type: 'base',
        updateRule: null,
        viewRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
      },
      {
        createRule: null,
        deleteRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text455797646',
            max: 0,
            min: 0,
            name: 'collectionRef',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text127846527',
            max: 0,
            min: 0,
            name: 'recordRef',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text2462348188',
            max: 0,
            min: 0,
            name: 'provider',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text1044722854',
            max: 0,
            min: 0,
            name: 'providerId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            hidden: false,
            id: 'autodate2990389176',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: true,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085495',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: true,
            type: 'autodate'
          }
        ],
        id: 'pbc_2281828961',
        indexes: [
          'CREATE UNIQUE INDEX `idx_externalAuths_record_provider` ON `_externalAuths` (collectionRef, recordRef, provider)',
          'CREATE UNIQUE INDEX `idx_externalAuths_collection_provider` ON `_externalAuths` (collectionRef, provider, providerId)'
        ],
        listRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
        name: '_externalAuths',
        system: true,
        type: 'base',
        updateRule: null,
        viewRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
      },
      {
        createRule: null,
        deleteRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text455797646',
            max: 0,
            min: 0,
            name: 'collectionRef',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text127846527',
            max: 0,
            min: 0,
            name: 'recordRef',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text4228609354',
            max: 0,
            min: 0,
            name: 'fingerprint',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            hidden: false,
            id: 'autodate2990389176',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: true,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085495',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: true,
            type: 'autodate'
          }
        ],
        id: 'pbc_4275539003',
        indexes: [
          'CREATE UNIQUE INDEX `idx_authOrigins_unique_pairs` ON `_authOrigins` (collectionRef, recordRef, fingerprint)'
        ],
        listRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
        name: '_authOrigins',
        system: true,
        type: 'base',
        updateRule: null,
        viewRule:
          "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
      },
      {
        authAlert: {
          emailTemplate: {
            body: "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location.</p>\n<p>If this was you, you may disregard this email.</p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
            subject: 'Login from a new location'
          },
          enabled: true
        },
        authRule: '',
        authToken: {
          duration: 86400
        },
        confirmEmailChangeTemplate: {
          body: '<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}" target="_blank" rel="noopener">Confirm new email</a>\n</p>\n<p><i>If you didn\'t ask to change your email address, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
          subject: 'Confirm your {APP_NAME} new email address'
        },
        createRule: null,
        deleteRule: null,
        emailChangeToken: {
          duration: 1800
        },
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cost: 0,
            hidden: true,
            id: 'password901924565',
            max: 0,
            min: 8,
            name: 'password',
            pattern: '',
            presentable: false,
            required: true,
            system: true,
            type: 'password'
          },
          {
            autogeneratePattern: '[a-zA-Z0-9]{50}',
            hidden: true,
            id: 'text2504183744',
            max: 60,
            min: 30,
            name: 'tokenKey',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'email3885137012',
            name: 'email',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: true,
            type: 'email'
          },
          {
            hidden: false,
            id: 'bool1547992806',
            name: 'emailVisibility',
            presentable: false,
            required: false,
            system: true,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'bool256245529',
            name: 'verified',
            presentable: false,
            required: false,
            system: true,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'autodate2990389176',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: true,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085495',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: true,
            type: 'autodate'
          }
        ],
        fileToken: {
          duration: 180
        },
        id: 'pbc_3142635823',
        indexes: [
          'CREATE UNIQUE INDEX `idx_tokenKey_pbc_3142635823` ON `_superusers` (`tokenKey`)',
          "CREATE UNIQUE INDEX `idx_email_pbc_3142635823` ON `_superusers` (`email`) WHERE `email` != ''"
        ],
        listRule: null,
        manageRule: null,
        mfa: {
          duration: 1800,
          enabled: false,
          rule: ''
        },
        name: '_superusers',
        oauth2: {
          enabled: false,
          mappedFields: {
            avatarURL: '',
            id: '',
            name: '',
            username: ''
          }
        },
        otp: {
          duration: 180,
          emailTemplate: {
            body: "<p>Hello,</p>\n<p>Your one-time password is: <strong>{OTP}</strong></p>\n<p><i>If you didn't ask for the one-time password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
            subject: 'OTP for {APP_NAME}'
          },
          enabled: false,
          length: 8
        },
        passwordAuth: {
          enabled: true,
          identityFields: ['email']
        },
        passwordResetToken: {
          duration: 1800
        },
        resetPasswordTemplate: {
          body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
          subject: 'Reset your {APP_NAME} password'
        },
        system: true,
        type: 'auth',
        updateRule: null,
        verificationTemplate: {
          body: '<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
          subject: 'Verify your {APP_NAME} email'
        },
        verificationToken: {
          duration: 259200
        },
        viewRule: null
      },
      {
        authAlert: {
          emailTemplate: {
            body: "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location.</p>\n<p>If this was you, you may disregard this email.</p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
            subject: 'Login from a new location'
          },
          enabled: true
        },
        authRule: '',
        authToken: {
          duration: 604800
        },
        confirmEmailChangeTemplate: {
          body: '<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}" target="_blank" rel="noopener">Confirm new email</a>\n</p>\n<p><i>If you didn\'t ask to change your email address, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
          subject: 'Confirm your {APP_NAME} new email address'
        },
        createRule: '',
        deleteRule: 'id = @request.auth.id',
        emailChangeToken: {
          duration: 1800
        },
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cost: 0,
            hidden: true,
            id: 'password901924565',
            max: 0,
            min: 8,
            name: 'password',
            pattern: '',
            presentable: false,
            required: true,
            system: true,
            type: 'password'
          },
          {
            autogeneratePattern: '[a-zA-Z0-9]{50}',
            hidden: true,
            id: 'text2504183744',
            max: 60,
            min: 30,
            name: 'tokenKey',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: true,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'email3885137012',
            name: 'email',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: true,
            type: 'email'
          },
          {
            hidden: false,
            id: 'bool1547992806',
            name: 'emailVisibility',
            presentable: false,
            required: false,
            system: true,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'bool256245529',
            name: 'verified',
            presentable: false,
            required: false,
            system: true,
            type: 'bool'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text349770936',
            max: 20,
            min: 17,
            name: 'snowflake',
            pattern: '^[0-9]+$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text1579384326',
            max: 100,
            min: 1,
            name: 'username',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text2710109796',
            max: 100,
            min: 1,
            name: 'nickname',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'number_reputation',
            max: null,
            min: null,
            name: 'reputation',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'autodate2990389176',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085495',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'file376926767',
            maxSelect: 1,
            maxSize: 0,
            mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'],
            name: 'avatar',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: null,
            type: 'file'
          }
        ],
        fileToken: {
          duration: 180
        },
        id: '_pb_users_auth_',
        indexes: [
          'CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)',
          "CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''",
          'CREATE INDEX idx_users_reputation ON _pb_users_auth_ (reputation DESC)',
          'CREATE UNIQUE INDEX `idx_eKEcsot3Y8` ON `users` (`snowflake`)'
        ],
        listRule: '',
        manageRule: null,
        mfa: {
          duration: 1800,
          enabled: false,
          rule: ''
        },
        name: 'users',
        oauth2: {
          enabled: true,
          mappedFields: {
            avatarURL: 'avatar',
            id: 'snowflake',
            name: 'nickname',
            username: 'username'
          }
        },
        otp: {
          duration: 180,
          emailTemplate: {
            body: "<p>Hello,</p>\n<p>Your one-time password is: <strong>{OTP}</strong></p>\n<p><i>If you didn't ask for the one-time password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
            subject: 'OTP for {APP_NAME}'
          },
          enabled: false,
          length: 8
        },
        passwordAuth: {
          enabled: false,
          identityFields: ['email']
        },
        passwordResetToken: {
          duration: 1800
        },
        resetPasswordTemplate: {
          body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
          subject: 'Reset your {APP_NAME} password'
        },
        system: false,
        type: 'auth',
        updateRule: 'id = @request.auth.id',
        verificationTemplate: {
          body: '<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
          subject: 'Verify your {APP_NAME} email'
        },
        verificationToken: {
          duration: 259200
        },
        viewRule: ''
      },
      {
        createRule: '@request.auth.id != ""',
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1470589867',
            hidden: false,
            id: 'relation_mob',
            maxSelect: 1,
            minSelect: 1,
            name: 'mob',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'number_hp',
            max: 100,
            min: 0,
            name: 'hp_percentage',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'number_channel',
            max: 1000,
            min: 1,
            name: 'channel_number',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'bool3766473888',
            name: 'full',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'relation_reporter',
            maxSelect: 1,
            minSelect: 1,
            name: 'reporter',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'number_upvotes',
            max: null,
            min: 0,
            name: 'upvotes',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'number_downvotes',
            max: null,
            min: 0,
            name: 'downvotes',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'number3009495418',
            max: 20,
            min: 1,
            name: 'location_image',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'autodate_created',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate_updated',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        id: 'pbc_3114863239',
        indexes: [
          'CREATE INDEX `idx_hp_reports_mob_channel_number` ON `hp_reports` (`mob`, `channel_number`)',
          'CREATE INDEX `idx_hp_reports_created` ON `hp_reports` (`created` DESC)',
          'CREATE INDEX `idx_hp_reports_mob_created` ON `hp_reports` (`mob`, `created` DESC)',
          'CREATE INDEX `idx_SpmvrpqL6w` ON `hp_reports` (\n  `reporter`,\n  `mob`,\n  `channel_number`,\n  `hp_percentage`,\n  `created`\n)'
        ],
        listRule: '',
        name: 'hp_reports',
        system: false,
        type: 'base',
        updateRule: null,
        viewRule: ''
      },
      {
        createRule: null,
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1470589867',
            hidden: false,
            id: 'relation4271371901',
            maxSelect: 1,
            minSelect: 0,
            name: 'mob',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'number1760765226',
            max: 1000,
            min: 1,
            name: 'channel_number',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'number3527176666',
            max: 100,
            min: 0,
            name: 'last_hp',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'autodate304265122',
            name: 'last_update',
            onCreate: false,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        id: 'pbc_3303527663',
        indexes: [
          'CREATE UNIQUE INDEX `idx_fDPJ9fS3fc` ON `mob_channel_status_sse` (\n  `mob`,\n  `channel_number`\n)',
          'CREATE INDEX `idx_7oZFxWsLjC` ON `mob_channel_status_sse` (`last_update` DESC)',
          'CREATE INDEX `idx_uRyIEbzajB` ON `mob_channel_status_sse` (`mob`)'
        ],
        listRule: '',
        name: 'mob_channel_status_sse',
        system: false,
        type: 'base',
        updateRule: null,
        viewRule: ''
      },
      {
        createRule: null,
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            hidden: false,
            id: 'number1402668550',
            max: 10,
            min: 1,
            name: 'uid',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text1579384326',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'number1307307527',
            max: 1000,
            min: 1,
            name: 'total_channels',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          }
        ],
        id: 'pbc_1612934933',
        indexes: ['CREATE UNIQUE INDEX `idx_f4ZxJtn0jy` ON `maps` (`uid`)'],
        listRule: '',
        name: 'maps',
        system: false,
        type: 'base',
        updateRule: null,
        viewRule: ''
      },
      {
        createRule: null,
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1470589867',
            hidden: false,
            id: 'relation1056859706',
            maxSelect: 1,
            minSelect: 0,
            name: 'mob',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'number_channel',
            max: 1000,
            min: 1,
            name: 'channel_number',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'number3527176666',
            max: 100,
            min: 0,
            name: 'last_hp',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'autodate304265122',
            name: 'last_update',
            onCreate: false,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        id: 'pbc_3682110470',
        indexes: [
          'CREATE UNIQUE INDEX `idx_mob_channel_status_unique` ON `mob_channel_status` (`mob`, `channel_number`)',
          'CREATE INDEX `idx_mob_channel_status_last_update` ON `mob_channel_status` (`last_update` DESC)',
          'CREATE INDEX `idx_mob_channel_status_mob` ON `mob_channel_status` (`mob`)'
        ],
        listRule: '',
        name: 'mob_channel_status',
        system: false,
        type: 'base',
        updateRule: null,
        viewRule: ''
      },
      {
        createRule: null,
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            hidden: false,
            id: 'number1402668550',
            max: 40,
            min: 1,
            name: 'uid',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'select2363381545',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['boss', 'magical_creature']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text_name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1612934933',
            hidden: false,
            id: 'relation2477632187',
            maxSelect: 1,
            minSelect: 0,
            name: 'map',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'number_respawn_time',
            max: 59,
            min: 0,
            name: 'respawn_time',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          }
        ],
        id: 'pbc_1470589867',
        indexes: [
          'CREATE UNIQUE INDEX `idx_mobs_name` ON `mobs` (`name`)',
          'CREATE INDEX `idx_mobs_map` ON `mobs` (`map`)',
          'CREATE UNIQUE INDEX `idx_8RzFGY6aeQ` ON `mobs` (`uid`)',
          'CREATE INDEX `idx_R7hOZ09G6X` ON `mobs` (`type`)'
        ],
        listRule: '',
        name: 'mobs',
        system: false,
        type: 'base',
        updateRule: null,
        viewRule: ''
      },
      {
        createRule: '@request.auth.id != "" && report.reporter != @request.auth.id',
        deleteRule: 'voter = @request.auth.id',
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3114863239',
            hidden: false,
            id: 'relation_report',
            maxSelect: 1,
            minSelect: 1,
            name: 'report',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'relation_voter',
            maxSelect: 1,
            minSelect: 1,
            name: 'voter',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'select_vote_type',
            maxSelect: 1,
            name: 'vote_type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['up', 'down']
          },
          {
            hidden: false,
            id: 'autodate_created',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate_updated',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        id: 'pbc_547380029',
        indexes: [
          'CREATE UNIQUE INDEX `idx_votes_unique_vote` ON `votes` (\n  `report`,\n  `voter`\n)',
          'CREATE INDEX `idx_votes_report` ON `votes` (`report`)',
          'CREATE INDEX `idx_votes_voter` ON `votes` (`voter`)',
          'CREATE INDEX `idx_votes_created` ON `votes` (`created` DESC)'
        ],
        listRule: '',
        name: 'votes',
        system: false,
        type: 'base',
        updateRule: 'voter = @request.auth.id',
        viewRule: ''
      },
      {
        createRule: null,
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'relation2375276105',
            maxSelect: 1,
            minSelect: 0,
            name: 'user',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '[a-z0-9]{50}',
            hidden: false,
            id: 'text3373460893',
            max: 50,
            min: 50,
            name: 'api_key',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'autodate2990389176',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085495',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        id: 'pbc_3577178630',
        indexes: [
          'CREATE UNIQUE INDEX `idx_uhKOGklQ0i` ON `api_keys` (`api_key`)',
          'CREATE UNIQUE INDEX `idx_zu7znqJ4EC` ON `api_keys` (`user`)'
        ],
        listRule: 'user = @request.auth.id',
        name: 'api_keys',
        system: false,
        type: 'base',
        updateRule: null,
        viewRule: 'user = @request.auth.id'
      },
      {
        createRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id',
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'relation2375276105',
            maxSelect: 1,
            minSelect: 0,
            name: 'user',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'date846843460',
            max: '',
            min: '',
            name: 'last_seen',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'text1631579359',
            max: 50,
            min: 0,
            name: 'session_id',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          }
        ],
        id: 'pbc_14482932',
        indexes: [
          'CREATE INDEX `idx_Sq15baJnT6` ON `page_presence` (`last_seen` DESC)',
          'CREATE INDEX `idx_I3ezck9YGp` ON `page_presence` (`session_id`)',
          'CREATE INDEX `idx_user_lookup` ON `page_presence` (`user`)'
        ],
        listRule: '',
        name: 'page_presence',
        system: false,
        type: 'base',
        updateRule: 'user = @request.auth.id',
        viewRule: ''
      },
      {
        createRule: null,
        deleteRule: null,
        fields: [
          {
            autogeneratePattern: '[a-z0-9]{15}',
            hidden: false,
            id: 'text3208210256',
            max: 15,
            min: 15,
            name: 'id',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: true,
            required: true,
            system: true,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1470589867',
            hidden: false,
            id: 'relation4271371901',
            maxSelect: 1,
            minSelect: 0,
            name: 'mob',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'select2363381545',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['reset']
          },
          {
            hidden: false,
            id: 'autodate2782324286',
            name: 'timestamp',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        id: 'pbc_1788492300',
        indexes: [
          'CREATE INDEX `idx_xQC2ktHohU` ON `mob_reset_events` (`timestamp` DESC)',
          'CREATE INDEX `idx_0fQrhcq9kY` ON `mob_reset_events` (\n  `mob`,\n  `timestamp` DESC\n)'
        ],
        listRule: '',
        name: 'mob_reset_events',
        system: false,
        type: 'base',
        updateRule: null,
        viewRule: ''
      }
    ];

    return app.importCollections(snapshot, false);
  },
  (app) => {
    return null;
  }
);
