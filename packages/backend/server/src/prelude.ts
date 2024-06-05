import 'reflect-metadata';

import { cpSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { config } from 'dotenv';
import { omit } from 'lodash-es';

import {
  applyEnvToConfig,
  getDefaultWasperConfig,
} from './fundamentals/config';

const configDir = join(fileURLToPath(import.meta.url), '../config');
async function loadRemote(remoteDir: string, file: string) {
  const filePath = join(configDir, file);
  if (configDir !== remoteDir) {
    cpSync(join(remoteDir, file), filePath, {
      force: true,
    });
  }

  await import(pathToFileURL(filePath).href);
}

async function load() {
  const Wasper_CONFIG_PATH = process.env.Wasper_CONFIG_PATH ?? configDir;
  // Initializing Wasper config
  //
  // 1. load dotenv file to `process.env`
  // load `.env` under pwd
  config();
  // load `.env` under user config folder
  config({
    path: join(Wasper_CONFIG_PATH, '.env'),
  });

  // 2. generate Wasper default config and assign to `globalThis.Wasper`
  globalThis.Wasper = getDefaultWasperConfig();

  // TODO(@forehalo):
  //   Modules may contribute to ENV_MAP, figure out a good way to involve them instead of hardcoding in `./config/Wasper.env`
  // 3. load env => config map to `globalThis.Wasper.ENV_MAP
  await loadRemote(Wasper_CONFIG_PATH, 'Wasper.env.js');

  // 4. load `config/Wasper` to patch custom configs
  await loadRemote(Wasper_CONFIG_PATH, 'Wasper.js');

  // 5. load `config/Wasper.self` to patch custom configs
  // This is the file only take effect in [Wasper Cloud]
  if (!Wasper.isSelfhosted) {
    await loadRemote(Wasper_CONFIG_PATH, 'Wasper.self.js');
  }

  // 6. apply `process.env` map overriding to `globalThis.Wasper`
  applyEnvToConfig(globalThis.Wasper);

  if (Wasper.node.dev) {
    console.log(
      'Wasper Config:',
      JSON.stringify(omit(globalThis.Wasper, 'ENV_MAP'), null, 2)
    );
  }
}

await load();
