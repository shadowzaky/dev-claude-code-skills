#!/usr/bin/env node
'use strict';

// Validates the repo's own content: skill frontmatter, command files, the plugin
// manifest, and cross-references between them. A skill with a malformed `name:`
// loads silently as nothing, so these checks exist to make that failure loud.

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');
const commandsDir = path.join(repoRoot, 'commands');
const manifestPath = path.join(repoRoot, '.claude-plugin', 'plugin.json');

const MAX_DESCRIPTION_LENGTH = 1024;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Flavors are skills named flavor-<name>. Core loop skills resolve them from the
// `> Flavor: <name>` marker in a project's ARCHITECTURE.md, and each consuming skill
// reads exactly one of these sections — a missing one leaves that skill nothing to apply.
const FLAVOR_PREFIX = 'flavor-';
const FLAVOR_REQUIRED_SECTIONS = [
  '## Activation',
  '## Milestone criteria',
  '## Dev standards',
  '## QA checks',
  '## Review dimensions',
  '## Architecture extensions',
];

// Slash commands provided by Claude Code itself — referencing these is not a broken link.
const BUILTIN_COMMANDS = new Set([
  'clear', 'compact', 'config', 'cost', 'doctor', 'help', 'init', 'login',
  'logout', 'memory', 'model', 'plugin', 'reload-plugins', 'resume', 'review', 'vim',
]);

const errors = [];
const warnings = [];

function error(file, message) {
  errors.push(`${file}: ${message}`);
}

function warn(file, message) {
  warnings.push(`${file}: ${message}`);
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function readJsonOrNull(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
}

/**
 * Parses the leading `---` delimited YAML block. Only the flat scalar fields the
 * plugin actually uses are supported, including `>` folded block values.
 */
function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const fields = {};
  let currentKey = null;

  for (const rawLine of match[1].split(/\r?\n/)) {
    const keyed = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyed) {
      const [, key, value] = keyed;
      currentKey = key;
      fields[key] = value === '>' || value === '|' ? '' : value.trim();
      continue;
    }
    if (currentKey && rawLine.trim()) {
      fields[currentKey] = `${fields[currentKey]} ${rawLine.trim()}`.trim();
    }
  }

  return fields;
}

// --- Skills ------------------------------------------------------------------

const skillNames = new Set();
const flavorNames = new Set();
const seenNames = new Map();

if (!fs.existsSync(skillsDir)) {
  error('skills/', 'directory does not exist');
} else {
  const skillDirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (skillDirs.length === 0) error('skills/', 'contains no skill directories');

  for (const dirName of skillDirs) {
    const skillPath = path.join(skillsDir, dirName, 'SKILL.md');
    const label = relative(skillPath);

    if (!fs.existsSync(skillPath)) {
      error(`skills/${dirName}/`, 'missing SKILL.md — Claude Code will not discover this skill');
      continue;
    }

    if (!KEBAB_CASE.test(dirName)) {
      error(`skills/${dirName}/`, 'directory name must be kebab-case');
    }

    const source = fs.readFileSync(skillPath, 'utf8');
    const frontmatter = parseFrontmatter(source);

    if (!frontmatter) {
      error(label, 'no YAML frontmatter — the skill will never load');
      continue;
    }

    const { name, description } = frontmatter;

    if (!name) {
      error(label, 'frontmatter is missing `name`');
    } else {
      if (name !== dirName) {
        error(label, `frontmatter name "${name}" does not match directory "${dirName}"`);
      }
      if (!KEBAB_CASE.test(name)) {
        error(label, `name "${name}" must be kebab-case`);
      }
      if (seenNames.has(name)) {
        error(label, `duplicate skill name "${name}" — also declared in ${seenNames.get(name)}`);
      }
      seenNames.set(name, label);
      skillNames.add(name);
    }

    if (!description) {
      error(label, 'frontmatter is missing `description` — nothing will trigger this skill');
    } else {
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        error(label, `description is ${description.length} chars (max ${MAX_DESCRIPTION_LENGTH})`);
      }
      // Flavors are resolved by name from a project's marker, not matched against user
      // phrasing, so trigger wording is irrelevant — what matters is that the description
      // says the loop invokes it, so nobody documents it as a user-facing command.
      if (dirName.startsWith(FLAVOR_PREFIX)) {
        if (!/invoked by/i.test(description)) {
          warn(label, 'flavor description should state that core loop skills invoke it');
        }
      } else {
        if (!/trigger/i.test(description)) {
          warn(label, 'description does not mention triggers — auto-invocation will be unreliable');
        }
        if (name && !description.includes(`/${name}`)) {
          warn(label, `description does not list the "/${name}" invocation`);
        }
      }
    }

    const body = source.slice(source.indexOf('---', 3) + 3).trim();
    if (body.length < 200) {
      warn(label, 'body is very short — skills need enough instruction to be useful');
    }

    if (dirName.startsWith(FLAVOR_PREFIX)) {
      flavorNames.add(dirName.slice(FLAVOR_PREFIX.length));
      for (const section of FLAVOR_REQUIRED_SECTIONS) {
        if (!body.includes(`${section}\n`)) {
          error(label, `flavor is missing the "${section}" section — the skill that consumes it would find nothing to apply`);
        }
      }
      if (dirName === FLAVOR_PREFIX.slice(0, -1) || dirName === FLAVOR_PREFIX) {
        error(label, 'flavor directory needs a name after the prefix, e.g. flavor-game-dev');
      }
    }
  }
}

// --- Commands ----------------------------------------------------------------

const commandNames = new Set();

if (!fs.existsSync(commandsDir)) {
  error('commands/', 'directory does not exist');
} else {
  for (const file of listMarkdown(commandsDir)) {
    const commandPath = path.join(commandsDir, file);
    const label = relative(commandPath);
    const base = file.replace(/\.md$/, '');

    if (!KEBAB_CASE.test(base)) {
      error(label, 'command file name must be kebab-case');
    }
    commandNames.add(base);

    const source = fs.readFileSync(commandPath, 'utf8');

    if (source.trimStart().startsWith('---')) {
      warn(label, 'commands are plain markdown — frontmatter is not expected here');
    }
    if (source.trim().length === 0) {
      error(label, 'file is empty');
      continue;
    }

    const firstLine = source.split(/\r?\n/).find((line) => line.trim().length > 0) || '';
    if (firstLine.startsWith('#')) {
      warn(label, 'first line should be a one-sentence description, not a heading');
    }
  }
}

// --- Core neutrality ---------------------------------------------------------

// Core skills and commands resolve `flavor-<name>` from a project's marker; they must never
// name a specific flavor. Naming one puts domain vocabulary in the core, which is exactly
// what the flavor mechanism exists to prevent. Docs and README may name flavors freely.
for (const flavor of flavorNames) {
  const targets = [
    ...fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith(FLAVOR_PREFIX))
      .map((entry) => path.join(skillsDir, entry.name, 'SKILL.md')),
    ...listMarkdown(commandsDir).map((file) => path.join(commandsDir, file)),
  ].filter((file) => fs.existsSync(file));

  // Word-boundary match, not substring: a flavor named "web" must not fire on "website".
  // Short generic flavor names can still collide with ordinary prose — pick specific ones.
  const mention = new RegExp(`\\b${flavor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);

  for (const file of targets) {
    if (mention.test(fs.readFileSync(file, 'utf8'))) {
      error(
        relative(file),
        `names the "${flavor}" flavor — core skills and commands must resolve flavor-<name> generically`
      );
    }
  }
}

// --- Flavor marker -----------------------------------------------------------

// Two marker forms resolve (ADR-0001):
//
//   > Flavor: my-domain            ->  flavor-my-domain, a skill in this package
//   > Flavor: my-domain@some-pack  ->  some-pack:flavor, a skill from a separate plugin
//
// The bare form is tried first in both cases, so the marker stays stable when a flavor moves
// between the package and a plugin.
//
// Only this repo's own ARCHITECTURE.md is checked here. A consuming project's marker is
// validated at runtime by dev/qa/milestones/architecture/review-branch, which stop when it
// does not resolve. A plugin skill is invisible from here either way — nothing in this repo
// can see inside another plugin — so the namespaced form is confirmed at runtime, not now.

const MARKER_KEY = 'Flavor';
const NEAR_MISS_MAX_DISTANCE = 2;

/** Levenshtein distance. Small inputs only — this compares header keys against one word. */
function editDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous = current;
  }

  return previous[b.length];
}

/**
 * The contiguous run of blockquote lines at the top of the document, which is where the
 * marker lives. Restricting the scan to it keeps ordinary blockquotes further down from
 * being mistaken for malformed markers.
 */
function headerBlock(source) {
  const block = [];
  let started = false;

  for (const line of source.split(/\r?\n/)) {
    if (line.trimStart().startsWith('>')) {
      started = true;
      block.push(line);
      continue;
    }
    if (started) break;
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    break;
  }

  return block;
}

const architecturePath = path.join(repoRoot, 'ARCHITECTURE.md');
if (fs.existsSync(architecturePath)) {
  let markerValue = null;

  for (const line of headerBlock(fs.readFileSync(architecturePath, 'utf8'))) {
    // The key is captured exactly as written, trailing space included, so that `Flavor :`
    // is judged a near-miss instead of being quietly accepted.
    const keyed = line.match(/^\s*>\s*([^:]{1,40}):\s*(.*)$/);
    if (!keyed) continue;

    const [, rawKey, value] = keyed;

    if (rawKey === MARKER_KEY) {
      if (markerValue !== null) {
        error('ARCHITECTURE.md', `declares more than one "${MARKER_KEY}:" marker — a project has at most one flavor`);
      }
      markerValue = value.trim();
      continue;
    }

    // A misspelled key matches no marker at all, so without this the project reads as
    // unflavored and every phase runs with core defaults, silently (ADR-0001).
    const normalized = rawKey.toLowerCase().replace(/[^a-z]/g, '');
    if (editDistance(normalized, MARKER_KEY.toLowerCase()) <= NEAR_MISS_MAX_DISTANCE) {
      error(
        'ARCHITECTURE.md',
        `header key "${rawKey}:" looks like a misspelled "${MARKER_KEY}:" — the flavor ` +
        `would be ignored and every phase would run unflavored`
      );
    }
  }

  if (markerValue === '') {
    error('ARCHITECTURE.md', `"${MARKER_KEY}:" marker has no value — name a flavor or remove the line`);
  } else if (markerValue !== null) {
    const [name, plugin, ...extra] = markerValue.split('@');
    const bareSkill = `${FLAVOR_PREFIX}${name}`;

    if (extra.length > 0) {
      error('ARCHITECTURE.md', `flavor marker "${markerValue}" has more than one "@" — expected <name> or <name>@<plugin>`);
    } else if (!KEBAB_CASE.test(name) || (plugin !== undefined && !KEBAB_CASE.test(plugin))) {
      error('ARCHITECTURE.md', `flavor marker "${markerValue}" must be kebab-case, as <name> or <name>@<plugin>`);
    } else if (skillNames.has(bareSkill)) {
      // Resolved in this package. The bare form wins for both marker forms.
    } else if (plugin) {
      warn(
        'ARCHITECTURE.md',
        `flavor "${markerValue}" resolves to the plugin skill "${plugin}:flavor" — validation ` +
        `cannot see inside another plugin, so the loop skills confirm it at runtime`
      );
    } else {
      error('ARCHITECTURE.md', `declares flavor "${markerValue}" but no ${bareSkill} skill exists`);
    }
  }
}

// --- Plugin manifest ---------------------------------------------------------

if (!fs.existsSync(manifestPath)) {
  error('.claude-plugin/plugin.json', 'missing — Claude Code will not register the plugin');
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.name) error('.claude-plugin/plugin.json', 'missing `name`');
    if (!manifest.description) warn('.claude-plugin/plugin.json', 'missing `description`');
  } catch (err) {
    error('.claude-plugin/plugin.json', `invalid JSON — ${err.message}`);
  }
}

// --- Zero-dependency constraint ----------------------------------------------

// These scripts run in postinstall on every teammate's machine. A dependency there is both
// a supply-chain surface and a failure mode nobody can debug mid-install.
const pkg = readJsonOrNull(path.join(repoRoot, 'package.json'));
if (pkg) {
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    const names = Object.keys(pkg[field] || {});
    if (names.length > 0) {
      error('package.json', `${field} must stay empty — found ${names.join(', ')}`);
    }
  }
}

// --- Cross-references --------------------------------------------------------

// Every `/thing` mentioned in the repo's markdown must resolve to a skill, a
// command, or a Claude Code builtin. A stale reference sends the user nowhere.
const known = new Set([...skillNames, ...commandNames, ...BUILTIN_COMMANDS]);

function collectMarkdown(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectMarkdown(full, found);
    else if (entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

const markdownFiles = [
  ...collectMarkdown(skillsDir),
  ...collectMarkdown(commandsDir),
  ...collectMarkdown(path.join(repoRoot, 'docs')),
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'CLAUDE.md'),
].filter((file) => fs.existsSync(file));

for (const file of markdownFiles) {
  const source = fs.readFileSync(file, 'utf8');

  // Files containing illustrative slash names (route URLs, hypothetical skills) declare
  // them: <!-- validate: allow-refs deploy, audit -->
  const allowed = new Set(
    [...source.matchAll(/<!--\s*validate:\s*allow-refs\s+([^>]+?)\s*-->/g)]
      .flatMap((m) => m[1].split(',').map((ref) => ref.trim().replace(/^\//, '')))
      .filter(Boolean)
  );

  // Backtick-quoted slash references only — prose like "and/or" is not a command.
  const referenced = new Set(
    [...source.matchAll(/`\/([a-z0-9][a-z0-9-]*)`/g)].map((m) => m[1])
  );

  for (const ref of referenced) {
    if (!known.has(ref) && !allowed.has(ref)) {
      error(relative(file), `references "/${ref}" which is not a skill, command, or builtin`);
    }
  }
}

// --- Report ------------------------------------------------------------------

for (const message of warnings) console.warn(`  warn   ${message}`);
for (const message of errors) console.error(`  ERROR  ${message}`);

const skillCount = skillNames.size;
const commandCount = commandNames.size;

console.log(
  `\n${skillCount} skills, ${commandCount} commands checked — ` +
  `${errors.length} errors, ${warnings.length} warnings`
);

if (errors.length > 0) {
  console.error('\nValidation failed.');
  process.exit(1);
}

console.log('Validation passed.');
