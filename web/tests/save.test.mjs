import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clearSave, parseSave, readSaveFile, readStoredSave, writeSave } from '../src/save.ts';

const currentSave = {
  version: 11,
  time: 120,
  savedAt: '2026-11-11T00:00:00.000Z',
  oreDelivered: 2400,
  sortiesCompleted: 40,
  hazards: { charted: true, radiationCharted: false },
};

test('accepts save envelopes for versions 2 through 11 without dropping sim data', () => {
  for (let version = 2; version <= 11; version++) {
    const envelope = { version, time: 10, rocks: [{ ore: 60 }] };
    assert.deepEqual(parseSave(JSON.stringify(envelope)), envelope);
  }
});

test('rejects malformed JSON and missing or invalid envelope fields', () => {
  for (const input of [
    '',
    '{',
    'null',
    '[]',
    '{}',
    '{"version":"11","time":1}',
    '{"version":11}',
    '{"version":11.5,"time":0}',
    '{"version":11,"time":1e999}',
  ]) {
    assert.equal(parseSave(input), null, input);
  }
});

test('imports a save file with version-specific data intact', async () => {
  const file = new File([JSON.stringify(currentSave)], 'fleet.json');
  assert.deepEqual(await readSaveFile(file), currentSave);
});

test('stores, reads and clears a save', (t) => {
  const data = new Map();
  mockStorage(t, {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  });
  const raw = writeSave(currentSave, null);
  assert.equal(raw, JSON.stringify(currentSave));
  assert.equal(readStoredSave(), raw);
  assert.equal(clearSave(raw), true);
  assert.equal(readStoredSave(), null);
});

test('handles unavailable browser storage', (t) => {
  mockStorage(t, {
    getItem: blocked,
    setItem: blocked,
    removeItem: blocked,
  });
  assert.equal(readStoredSave(), undefined);
  assert.equal(writeSave(currentSave, undefined), null);
  assert.equal(clearSave(undefined), false);
});

test('preserves raw rejected saves and blocks writes based on an outdated read', (t) => {
  const raw = '  {broken JSON\n';
  mockStorage(t, { getItem: () => raw, setItem: assert.fail, removeItem: assert.fail });
  assert.equal(readStoredSave(), raw);
  assert.equal(writeSave(currentSave, null), null);
  assert.equal(clearSave(null), false);
});

function blocked() {
  throw new DOMException('Site data blocked', 'SecurityError');
}

function mockStorage(t, storage) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });
}
