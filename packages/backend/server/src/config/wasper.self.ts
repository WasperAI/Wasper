/* eslint-disable @typescript-eslint/no-non-null-assertion */
// Custom configurations for Wasper Cloud
// ====================================================================================
// Q: WHY THIS FILE EXISTS?
// A: Wasper deployment environment may have a lot of custom environment variables,
//    which are not suitable to be put in the `Wasper.ts` file.
//    For example, Wasper Cloud Clusters are deployed on Google Cloud Platform.
//    We need to enable the `gcloud` plugin to make sure the nodes working well,
//    but the default selfhost version may not require it.
//    So it's not a good idea to put such logic in the common `Wasper.ts` file.
//
//    ```
//    if (Wasper.deploy) {
//      Wasper.plugins.use('gcloud');
//    }
//    ```
// ====================================================================================
const env = process.env;

Wasper.metrics.enabled = !Wasper.node.test;

if (env.R2_OBJECT_STORAGE_ACCOUNT_ID) {
  Wasper.plugins.use('cloudflare-r2', {
    accountId: env.R2_OBJECT_STORAGE_ACCOUNT_ID,
    credentials: {
      accessKeyId: env.R2_OBJECT_STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_OBJECT_STORAGE_SECRET_ACCESS_KEY!,
    },
  });
  Wasper.storage.storages.avatar.provider = 'cloudflare-r2';
  Wasper.storage.storages.avatar.bucket = 'account-avatar';
  Wasper.storage.storages.avatar.publicLinkFactory = key =>
    `https://avatar.Wasperassets.com/${key}`;

  Wasper.storage.storages.blob.provider = 'cloudflare-r2';
  Wasper.storage.storages.blob.bucket = `workspace-blobs-${
    Wasper.Wasper.canary ? 'canary' : 'prod'
  }`;

  Wasper.storage.storages.copilot.provider = 'cloudflare-r2';
  Wasper.storage.storages.copilot.bucket = `workspace-copilot-${
    Wasper.Wasper.canary ? 'canary' : 'prod'
  }`;
}

Wasper.plugins.use('copilot', {
  openai: {},
  fal: {},
});
Wasper.plugins.use('redis');
Wasper.plugins.use('payment', {
  stripe: {
    keys: {
      // fake the key to ensure the server generate full GraphQL Schema even env vars are not set
      APIKey: '1',
      webhookKey: '1',
    },
  },
});
Wasper.plugins.use('oauth');

if (Wasper.deploy) {
  Wasper.mailer = {
    service: 'gmail',
    auth: {
      user: env.MAILER_USER,
      pass: env.MAILER_PASSWORD,
    },
  };

  Wasper.plugins.use('gcloud');
}
