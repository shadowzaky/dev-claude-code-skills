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

// Slash commands provided by Claude Code itself — referencing these is not a broken link.
const BUILTIN_COMMANDS = new Set([
  'clear', 'compact', 'config', 'cost', 'doctor', 'help', 'init', 'login',
  'logout', 'memory', 'model', 'resume', 'review', 'vim',
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
      if (!/trigger/i.test(description)) {
        warn(label, 'description does not mention triggers — auto-invocation will be unreliable');
      }
      if (name && !description.includes(`/${name}`)) {
        warn(label, `description does not list the "/${name}" invocation`);
      }
    }

    const body = source.slice(source.indexOf('---', 3) + 3).trim();
    if (body.length < 200) {
      warn(label, 'body is very short — skills need enough instruction to be useful');
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
