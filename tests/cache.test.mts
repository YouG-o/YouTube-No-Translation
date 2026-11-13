import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;
type Entry = { content: string; timestamp: number };

for (const [name, exportName, getter, setter] of [
    ['titles', 'titleCache', 'getTitle', 'setTitle'],
    ['descriptions', 'descriptionCache', 'getDescription', 'setDescription']
]) {
    const path = name === 'titles' ? 'titles' : 'description';
    const source = transformSync(readFileSync(new URL(`../src/content/${path}/index.ts`, import.meta.url), 'utf8'), {
        loader: 'ts', format: 'cjs'
    }).code;

    async function load(entries: Record<string, Entry>) {
        let reads = 0;
        let writes = 0;
        let stored: Record<string, unknown> = { [name]: entries, unrelated: 'preserved' };
        const context = {
            module: { exports: {} as Record<string, any> },
            Date: class extends Date { static now() { return NOW; } },
            require: (module: string) => {
                if (module.endsWith('/navigation')) return { isIrrelevantIframe: () => false };
                if (module.endsWith('/browser')) return { isSafari: () => false };
                return { titlesLog() {}, titlesErrorLog() {}, descriptionLog() {}, descriptionErrorLog() {}, coreLog() {} };
            },
            browser: {
                runtime: { onMessage: { addListener() {} } },
                storage: { local: {
                    async get() { reads++; return { 'ynt-cache': stored }; },
                    async set(value: { 'ynt-cache': Record<string, unknown> }) { writes++; stored = value['ynt-cache']; }
                } }
            }
        };
        runInNewContext(source, context);
        const cache = context.module.exports[exportName];
        await cache.loadCache();
        return { cache, get reads() { return reads; }, get writes() { return writes; }, get stored() { return stored; } };
    }

    test(`${name}: preserves the exact expiration boundary and missing-entry behavior`, async () => {
        const { cache } = await load({
            fresh: { content: 'Fresh content', timestamp: NOW },
            boundary: { content: 'Boundary content', timestamp: NOW - DAY },
            expired: { content: 'Expired content', timestamp: NOW - DAY - 1 }
        });
        assert.equal(cache[getter]('fresh'), 'Fresh content');
        assert.equal(cache[getter]('boundary'), 'Boundary content');
        assert.equal(cache[getter]('expired'), undefined);
        assert.equal(cache[getter]('missing'), undefined);
    });

    test(`${name}: repeated reads do not scan other entries or access storage`, async () => {
        let scans = 0;
        const entries = new Proxy({ fresh: { content: 'Original content', timestamp: NOW } }, {
            ownKeys(target) { scans++; return Reflect.ownKeys(target); }
        });
        const fixture = await load(entries);
        const initialReads = fixture.reads;
        for (let i = 0; i < 100; i++) assert.equal(fixture.cache[getter]('fresh'), 'Original content');
        assert.equal(scans, 0);
        assert.equal(fixture.reads, initialReads);
        assert.equal(fixture.writes, 0);
    });

    test(`${name}: writes still remove expired entries and persist new content`, async () => {
        const fixture = await load({ expired: { content: 'Expired content', timestamp: NOW - DAY - 1 } });
        assert.equal(fixture.cache[getter]('expired'), undefined);
        assert.equal(fixture.writes, 0);
        await fixture.cache[setter]('new', 'New content');
        const saved = JSON.parse(fixture.stored[name] as string);
        assert.equal(saved.expired, undefined);
        assert.deepEqual(saved.new, { content: 'New content', timestamp: NOW });
        assert.equal(fixture.stored.unrelated, 'preserved');
    });
}
