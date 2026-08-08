/**
 * Генерирует дерево src/ с описаниями и вставляет его в ai/AGENTS.md
 * между маркерами TREE:START / TREE:END.
 *
 *   node scripts/generate-tree.mjs           — перезаписать блок в AGENTS.md
 *   node scripts/generate-tree.mjs --check   — упасть, если блок устарел (для CI / pre-commit)
 *
 * Описания берутся из ai/tree-comments.json (ключ — путь от src/ через `/`).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'src');
const DOC_FILE = join(ROOT, 'ai', 'AGENTS.md');
const COMMENTS_FILE = join(ROOT, 'ai', 'tree-comments.json');

const START_MARKER = '<!-- TREE:START -->';
const END_MARKER = '<!-- TREE:END -->';
const IGNORED = new Set(['node_modules', '.DS_Store']);
const COMMENT_GAP = 2;

const isCheck = process.argv.includes('--check');
const comments = JSON.parse(readFileSync(COMMENTS_FILE, 'utf8'));
const usedKeys = new Set();

/** tree.com сортирует регистронезависимо — повторяем, чтобы diff был пустым */
function byName(left, right) {
    return left.localeCompare(right, 'en', { sensitivity: 'base' });
}

function readDir(absPath) {
    const entries = readdirSync(absPath, { withFileTypes: true }).filter(
        (entry) => !IGNORED.has(entry.name)
    );

    return {
        files: entries
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name)
            .sort(byName),
        dirs: entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort(byName),
    };
}

/** @returns {{ text: string, key: string | null }[]} */
function walk(absPath, relPath, contentPrefix) {
    const { files, dirs } = readDir(absPath);
    const rows = [];
    const filePrefix = dirs.length > 0 ? '│   ' : '    ';

    for (const file of files) {
        const key = relPath ? `${relPath}/${file}` : file;
        rows.push({ text: `${contentPrefix}${filePrefix}${file}`, key });
    }

    if (files.length > 0 && dirs.length > 0) {
        rows.push({ text: `${contentPrefix}│`, key: null });
    }

    dirs.forEach((dir, index) => {
        const isLast = index === dirs.length - 1;
        const key = relPath ? `${relPath}/${dir}` : dir;

        rows.push({ text: `${contentPrefix}${isLast ? '└───' : '├───'}${dir}`, key });
        rows.push(
            ...walk(
                join(absPath, dir),
                key,
                `${contentPrefix}${isLast ? '    ' : '│   '}`
            )
        );

        if (!isLast) {
            rows.push({ text: `${contentPrefix}│`, key: null });
        }
    });

    return rows;
}

function renderTree() {
    const rows = [{ text: '/src', key: null }, ...walk(SRC_DIR, '', '')];
    const missing = [];

    for (const row of rows) {
        if (!row.key) {
            continue;
        }

        // пустая строка в словаре — осознанный отказ от комментария (служебные сегменты api/model/ui)
        if (typeof comments[row.key] === 'string') {
            usedKeys.add(row.key);
        } else {
            missing.push(row.key);
        }
    }

    const width = Math.max(
        ...rows.filter((row) => row.key && comments[row.key]).map((row) => row.text.length)
    );

    const tree = rows
        .map((row) => {
            const comment = row.key ? comments[row.key] : undefined;

            return comment ? `${row.text.padEnd(width + COMMENT_GAP)}# ${comment}` : row.text;
        })
        .join('\n');

    return { block: ['```text', tree, '```'].join('\n'), missing };
}

const { block, missing } = renderTree();
const stale = Object.keys(comments).filter((key) => !usedKeys.has(key));

for (const key of missing) {
    console.warn(`[docs:tree] нет описания в ai/tree-comments.json: ${key}`);
}

for (const key of stale) {
    console.warn(`[docs:tree] описание указывает на несуществующий путь: ${key}`);
}

const doc = readFileSync(DOC_FILE, 'utf8');
const start = doc.indexOf(START_MARKER);
const end = doc.indexOf(END_MARKER);

if (start === -1 || end === -1) {
    console.error(`[docs:tree] в ${DOC_FILE} нет маркеров ${START_MARKER} / ${END_MARKER}`);
    process.exit(1);
}

const next =
    doc.slice(0, start + START_MARKER.length) + `\n\n${block}\n\n` + doc.slice(end);

if (next === doc) {
    if (missing.length > 0) {
        process.exit(1);
    }

    console.log('[docs:tree] структура в AGENTS.md актуальна');
    process.exit(0);
}

if (isCheck) {
    console.error(
        '[docs:tree] структура в ai/AGENTS.md устарела.\n' +
            '            Запустите `npm run docs:tree` и закоммитьте результат,\n' +
            '            либо отдайте агенту промпт ai/prompts/updateProjectTree.md — он допишет описания сам.'
    );
    process.exit(1);
}

writeFileSync(DOC_FILE, next);
console.log('[docs:tree] структура в ai/AGENTS.md обновлена');
process.exit(missing.length > 0 ? 1 : 0);
