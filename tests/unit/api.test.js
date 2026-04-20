import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient constructor defaults', () => {
  it('creates instance with no arguments', () => {
    const client = new ScormClient();
    expect(client.version).toBeNull();
    expect(client.isActive).toBe(false);
  });

  it('accepts pre-set version', () => {
    const client = new ScormClient({ version: '1.2' });
    expect(client.version).toBe('1.2');
  });

  it('isAvailable returns true', () => {
    expect(new ScormClient().isAvailable()).toBe(true);
  });
});

describe('ScormClient API detection (SCORM 1.2)', () => {
  let api;

  beforeEach(() => { api = mockApi12(); window.API = api; });
  afterEach(() => { delete window.API; });

  it('auto-detects 1.2 version on init', () => {
    const client = new ScormClient();
    client.init();
    expect(client.version).toBe('1.2');
  });
});

describe('ScormClient API detection (SCORM 2004)', () => {
  let api;

  beforeEach(() => { api = mockApi2004(); window.API_1484_11 = api; });
  afterEach(() => { delete window.API_1484_11; });

  it('auto-detects 2004 version on init', () => {
    const client = new ScormClient();
    client.init();
    expect(client.version).toBe('2004');
  });
});

describe('ScormClient API detection — cross-origin parent', () => {
  afterEach(() => { delete window.API; });

  it('does not throw when parent window access raises SecurityError', () => {
    // Simulate a hostile parent that throws on every property read.
    const hostileParent = new Proxy({}, {
      get() { throw new Error('SecurityError: cross-origin blocked'); },
    });
    const originalParent = Object.getOwnPropertyDescriptor(window, 'parent');
    Object.defineProperty(window, 'parent', { value: hostileParent, configurable: true });
    window.API = mockApi12();

    const client = new ScormClient();
    expect(() => client.init()).not.toThrow();
    expect(client.version).toBe('1.2');

    // Restore.
    if (originalParent) Object.defineProperty(window, 'parent', originalParent);
    else delete window.parent;
  });
});
