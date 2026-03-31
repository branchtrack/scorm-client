import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import pipwerks from '../../src/scorm_api_wrapper.js';
import { resetScorm, mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('SCORM.API.find', () => {
  beforeEach(() => resetScorm(pipwerks));

  it('detects SCORM 1.2 API and sets version', () => {
    const api = mockApi12();
    const fakeWin = { API: api };
    fakeWin.parent = fakeWin;

    const result = pipwerks.SCORM.API.find(fakeWin);

    expect(result).toBe(api);
    expect(pipwerks.SCORM.version).toBe('1.2');
  });

  it('detects SCORM 2004 API and sets version', () => {
    const api = mockApi2004();
    const fakeWin = { API_1484_11: api };
    fakeWin.parent = fakeWin;

    const result = pipwerks.SCORM.API.find(fakeWin);

    expect(result).toBe(api);
    expect(pipwerks.SCORM.version).toBe('2004');
  });

  it('returns correct API when version pre-set to "1.2"', () => {
    pipwerks.SCORM.version = '1.2';
    const api = mockApi12();
    const fakeWin = { API: api };
    fakeWin.parent = fakeWin;

    expect(pipwerks.SCORM.API.find(fakeWin)).toBe(api);
  });

  it('returns correct API when version pre-set to "2004"', () => {
    pipwerks.SCORM.version = '2004';
    const api = mockApi2004();
    const fakeWin = { API_1484_11: api };
    fakeWin.parent = fakeWin;

    expect(pipwerks.SCORM.API.find(fakeWin)).toBe(api);
  });

  it('returns null when version is "1.2" but only API_1484_11 exists', () => {
    pipwerks.SCORM.version = '1.2';
    const fakeWin = { API_1484_11: mockApi2004() };
    fakeWin.parent = fakeWin;

    expect(pipwerks.SCORM.API.find(fakeWin)).toBeNull();
  });

  it('returns null when no API found on window', () => {
    const fakeWin = {};
    fakeWin.parent = fakeWin;

    expect(pipwerks.SCORM.API.find(fakeWin)).toBeNull();
  });
});

describe('SCORM.API.get', () => {
  beforeEach(() => {
    resetScorm(pipwerks);
    delete window.API;
    delete window.API_1484_11;
  });

  afterEach(() => {
    delete window.API;
    delete window.API_1484_11;
  });

  it('finds SCORM 1.2 API from window and sets isFound', () => {
    const api = mockApi12();
    window.API = api;

    const result = pipwerks.SCORM.API.get();

    expect(result).toBe(api);
    expect(pipwerks.SCORM.API.isFound).toBe(true);
  });

  it('finds SCORM 2004 API from window', () => {
    const api = mockApi2004();
    window.API_1484_11 = api;

    const result = pipwerks.SCORM.API.get();

    expect(result).toBe(api);
    expect(pipwerks.SCORM.API.isFound).toBe(true);
  });

  it('returns null and leaves isFound false when no API on window', () => {
    const result = pipwerks.SCORM.API.get();

    expect(result).toBeNull();
    expect(pipwerks.SCORM.API.isFound).toBe(false);
  });
});

describe('SCORM.API.getHandle', () => {
  beforeEach(() => {
    resetScorm(pipwerks);
    delete window.API;
  });

  afterEach(() => {
    delete window.API;
  });

  it('returns handle and caches it after first call', () => {
    const api = mockApi12();
    window.API = api;

    const first = pipwerks.SCORM.API.getHandle();
    expect(first).toBe(api);

    delete window.API;
    const second = pipwerks.SCORM.API.getHandle();
    expect(second).toBe(api);
  });
});
