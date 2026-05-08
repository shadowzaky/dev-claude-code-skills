#!/usr/bin/env node
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

const PLUGIN_ID = 'claude-code-skills@npm';
const claudeDir = path.join(os.homedir(), '.claude');
const pluginRoot = path.resolve(__dirname, '..');
const pkg = require('../package.json');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// 1. Copy commands to ~/.claude/commands/
const commandsSrc = path.join(pluginRoot, 'commands');
const commandsDest = path.join(claudeDir, 'commands');
fs.mkdirSync(commandsDest, { recursive: true });

if (fs.existsSync(commandsSrc)) {
  for (const file of fs.readdirSync(commandsSrc)) {
    if (file.endsWith('.md')) {
      fs.copyFileSync(path.join(commandsSrc, file), path.join(commandsDest, file));
      console.log(`  [command] ${file}`);
    }
  }
}

// 2. Register plugin in installed_plugins.json
const installedPluginsPath = path.join(claudeDir, 'plugins', 'installed_plugins.json');
const installedPlugins = readJson(installedPluginsPath) || { version: 2, plugins: {} };

const existing = installedPlugins.plugins[PLUGIN_ID];
const now = new Date().toISOString();
installedPlugins.plugins[PLUGIN_ID] = [{
  scope: 'user',
  installPath: pluginRoot,
  version: pkg.version,
  installedAt: existing?.[0]?.installedAt || now,
  lastUpdated: now,
  gitCommitSha: null,
}];

writeJson(installedPluginsPath, installedPlugins);
console.log(`  [plugin]  registered ${PLUGIN_ID} -> ${pluginRoot}`);

// 3. Enable plugin in settings.json
const settingsPath = path.join(claudeDir, 'settings.json');
const settings = readJson(settingsPath) || {};
settings.enabledPlugins = settings.enabledPlugins || {};
settings.enabledPlugins[PLUGIN_ID] = true;
writeJson(settingsPath, settings);
console.log(`  [plugin]  enabled in settings.json`);

console.log('\nInstalled claude-code-skills. Restart Claude Code to load skills.');
