#!/usr/bin/env node
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

const PLUGIN_ID = 'claude-code-skills@npm';
const claudeDir = path.join(os.homedir(), '.claude');
const pluginRoot = path.resolve(__dirname, '..');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// 1. Remove commands copied from this package
const commandsSrc = path.join(pluginRoot, 'commands');
const commandsDest = path.join(claudeDir, 'commands');

if (fs.existsSync(commandsSrc) && fs.existsSync(commandsDest)) {
  for (const file of fs.readdirSync(commandsSrc)) {
    if (file.endsWith('.md')) {
      const dest = path.join(commandsDest, file);
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
        console.log(`  [command] removed ${file}`);
      }
    }
  }
}

// 2. Remove skills this package installed, per the manifest
const manifestPath = path.join(claudeDir, '.claude-code-skills.json');
const manifest = readJson(manifestPath);
const skillsDest = path.join(claudeDir, 'skills');

for (const name of manifest?.skills || []) {
  const dir = path.join(skillsDest, name);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`  [skill]   removed ${name}`);
  }
}

if (fs.existsSync(manifestPath)) {
  fs.unlinkSync(manifestPath);
}

// 3. Remove from installed_plugins.json
const installedPluginsPath = path.join(claudeDir, 'plugins', 'installed_plugins.json');
const installedPlugins = readJson(installedPluginsPath);
if (installedPlugins?.plugins?.[PLUGIN_ID]) {
  delete installedPlugins.plugins[PLUGIN_ID];
  writeJson(installedPluginsPath, installedPlugins);
  console.log(`  [plugin]  unregistered ${PLUGIN_ID}`);
}

// 4. Disable in settings.json
const settingsPath = path.join(claudeDir, 'settings.json');
const settings = readJson(settingsPath);
if (settings?.enabledPlugins?.[PLUGIN_ID] !== undefined) {
  delete settings.enabledPlugins[PLUGIN_ID];
  writeJson(settingsPath, settings);
  console.log(`  [plugin]  disabled in settings.json`);
}

console.log('\nUninstalled claude-code-skills.');
