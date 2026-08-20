#!/usr/bin/env node
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

const PLUGIN_ID = 'claude-code-skills@npm';
const claudeDir = path.join(os.homedir(), '.claude');
const pluginRoot = path.resolve(__dirname, '..');
const pkg = require('../package.json');

// Skills are copied into ~/.claude/skills/ alongside commands, and the copies win over the
// plugin's own discovery. The manifest records which directories this package installed, so
// pruning a renamed or removed skill never touches one the user wrote by hand.
const MANIFEST_PATH = path.join(claudeDir, '.claude-code-skills.json');

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

// 2. Copy skills to ~/.claude/skills/
const skillsSrc = path.join(pluginRoot, 'skills');
const skillsDest = path.join(claudeDir, 'skills');
const installedSkills = [];

if (fs.existsSync(skillsSrc)) {
  fs.mkdirSync(skillsDest, { recursive: true });

  for (const entry of fs.readdirSync(skillsSrc, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const skillFile = path.join(skillsSrc, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    fs.mkdirSync(path.join(skillsDest, entry.name), { recursive: true });
    fs.copyFileSync(skillFile, path.join(skillsDest, entry.name, 'SKILL.md'));
    installedSkills.push(entry.name);
    console.log(`  [skill]   ${entry.name}`);
  }

  // Prune skills this package installed previously but no longer ships. Only names recorded
  // in the manifest are eligible — an unrecognised directory is the user's, not ours.
  const previous = readJson(MANIFEST_PATH)?.skills || [];
  for (const stale of previous.filter((name) => !installedSkills.includes(name))) {
    const staleDir = path.join(skillsDest, stale);
    if (fs.existsSync(staleDir)) {
      fs.rmSync(staleDir, { recursive: true, force: true });
      console.log(`  [skill]   removed ${stale} (no longer shipped)`);
    }
  }

  // Written only when skills/ was actually read. Writing an empty manifest on a package with
  // no skills directory would erase the record of what to clean up at uninstall.
  writeJson(MANIFEST_PATH, { skills: installedSkills, updatedAt: new Date().toISOString() });
}

// 3. Register plugin in installed_plugins.json
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

// 4. Enable plugin in settings.json
const settingsPath = path.join(claudeDir, 'settings.json');
const settings = readJson(settingsPath) || {};
settings.enabledPlugins = settings.enabledPlugins || {};
settings.enabledPlugins[PLUGIN_ID] = true;
writeJson(settingsPath, settings);
console.log(`  [plugin]  enabled in settings.json`);

console.log('\nInstalled claude-code-skills. Restart Claude Code to load skills.');
