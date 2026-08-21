#!/usr/bin/env node
'use strict';

// Installs a flavor into one project by copying its skill into that project's own
// .claude/skills/. Project-level skills load without a restart and stay scoped to the
// repository holding them, which is the only mechanism that delivers a flavor to one
// project and not to every other one on the machine (ADR-0005).
//
// Usage: node install-flavor.js <flavor-name> [--target <dir>]

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FLAVOR_PREFIX = 'flavor-';
const MANIFEST_NAME = 'flavor.json';
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const pluginRoot = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const homeClaudeDir = path.resolve(path.join(os.homedir(), '.claude'));

function fail(message) {
  console.error(`\nerror: ${message}`);
  process.exit(1);
}

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

function parseArgs(argv) {
  const positional = [];
  let target = process.cwd();

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--target') {
      target = argv[i + 1];
      if (!target) fail('--target needs a directory');
      i += 1;
      continue;
    }
    positional.push(argv[i]);
  }

  if (positional.length === 0) fail('name a flavor: install-flavor.js <flavor-name> [--target <dir>]');
  if (positional.length > 1) fail(`unexpected argument "${positional[1]}" — one flavor per run`);

  return { flavor: positional[0], target };
}

/**
 * The commit the copies came from, so a project can tell which revision it holds.
 * Absent when the package was installed from a tarball rather than a checkout — that is
 * not an error, it just means the sha cannot be recorded.
 */
function sourceSha() {
  try {
    return execFileSync('git', ['-C', pluginRoot, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null;
  } catch {
    return null;
  }
}

/**
 * Refuses any target that would put the flavor in the user's home Claude directory.
 * Everything there is active in every repository on the machine, which is precisely the
 * outcome this install exists to avoid (BR-021).
 */
function assertOutsideHomeClaude(claudeDir) {
  if (claudeDir === homeClaudeDir || claudeDir.startsWith(homeClaudeDir + path.sep)) {
    fail(
      `refusing to install into "${claudeDir}" — it is inside ~/.claude, where a flavor would ` +
      `be active in every project on this machine (BR-021). Point --target at a project instead.`
    );
  }
}

const { flavor, target } = parseArgs(process.argv.slice(2));

if (!KEBAB_CASE.test(flavor)) {
  fail(`flavor name "${flavor}" must be kebab-case, e.g. my-domain`);
}

const skillName = `${FLAVOR_PREFIX}${flavor}`;
const sourceDir = path.join(pluginRoot, 'skills', skillName);

if (!fs.existsSync(path.join(sourceDir, 'SKILL.md'))) {
  const available = fs
    .readdirSync(path.join(pluginRoot, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(FLAVOR_PREFIX))
    .map((entry) => entry.name.slice(FLAVOR_PREFIX.length));

  fail(
    `no "${flavor}" flavor in this package (looked for skills/${skillName}/SKILL.md).` +
    (available.length ? ` Available: ${available.join(', ')}` : ' This package ships no flavors.')
  );
}

const requestedRoot = path.resolve(target);
if (!fs.existsSync(requestedRoot) || !fs.statSync(requestedRoot).isDirectory()) {
  fail(`target "${requestedRoot}" is not a directory`);
}

// realpath, not resolve: a directory symlinked into ~/.claude would pass a string comparison
// and land the flavor in the one place BR-021 exists to keep it out of.
const targetRoot = fs.realpathSync(requestedRoot);
const claudeDir = path.join(targetRoot, '.claude');
assertOutsideHomeClaude(claudeDir);

const skillsDir = path.join(claudeDir, 'skills');
const manifestPath = path.join(claudeDir, MANIFEST_NAME);
const previous = readJson(manifestPath);

// Only directories this script recorded are ever removed. An unrecognised skill in the
// project belongs to whoever wrote it, and reinstalling a flavor must not delete it. A
// hand-edited manifest that lost the array shape prunes nothing rather than crashing.
const previouslyInstalled = Array.isArray(previous?.skills) ? previous.skills : [];
const installed = [skillName];

for (const stale of previouslyInstalled.filter((name) => !installed.includes(name))) {
  const staleDir = path.join(skillsDir, stale);
  if (fs.existsSync(staleDir)) {
    fs.rmSync(staleDir, { recursive: true, force: true });
    console.log(`  [removed] ${stale} (no longer part of this flavor)`);
  }
}

// Replaced rather than copied over, so a file dropped between versions does not survive
// as an orphan inside an otherwise-current skill.
const destDir = path.join(skillsDir, skillName);
fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(skillsDir, { recursive: true });
fs.cpSync(sourceDir, destDir, { recursive: true });
console.log(`  [skill]   ${skillName}`);

const isReinstall = previous?.flavor === flavor;
const upgradedFrom = isReinstall && previous.version !== pkg.version ? previous.version : null;
const now = new Date().toISOString();

writeJson(manifestPath, {
  flavor,
  version: pkg.version,
  sha: sourceSha(),
  skills: installed,
  installedAt: (isReinstall && previous.installedAt) || now,
  updatedAt: now,
});

console.log(`  [manifest] .claude/${MANIFEST_NAME}`);
console.log(
  upgradedFrom
    ? `\nUpgraded the ${flavor} flavor in ${targetRoot} (${upgradedFrom} -> ${pkg.version}).`
    : `\nInstalled the ${flavor} flavor into ${targetRoot}.`
);
console.log(`Declare it with "> Flavor: ${flavor}" in the project's ARCHITECTURE.md header block.`);
