import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient.score (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('score() — no arg returns raw score', () => {
    api.LMSGetValue.mockReturnValue('75');
    expect(client.score()).toBe('75');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.score.raw');
  });

  it('score(85) — sets score.raw', () => {
    expect(client.score(85)).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '85');
  });

  it('score({ raw, min, max }) — sets three fields', () => {
    client.score({ raw: 85, min: 0, max: 100 });
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '85');
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.min', '0');
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.max', '100');
  });

  it('score({ raw, scaled }) — silently ignores scaled on 1.2', () => {
    client.score({ raw: 85, scaled: 0.85 });
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '85');
    expect(api.LMSSetValue).not.toHaveBeenCalledWith(expect.stringContaining('scaled'), expect.anything());
  });

  it('returns false for invalid value type', () => {
    expect(client.score('bad')).toBe(false);
  });
});

describe('ScormClient.score (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('score() — no arg returns raw score', () => {
    api.GetValue.mockReturnValue('90');
    expect(client.score()).toBe('90');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.score.raw');
  });

  it('score(90) — sets score.raw', () => {
    expect(client.score(90)).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.raw', '90');
  });

  it('score({ raw, min, max, scaled }) — sets all four fields', () => {
    client.score({ raw: 90, min: 0, max: 100, scaled: 0.9 });
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.raw', '90');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.min', '0');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.max', '100');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.scaled', '0.9');
  });

  it('score({ raw }) — partial object sets only raw', () => {
    client.score({ raw: 42 });
    expect(api.SetValue).toHaveBeenCalledTimes(1);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.raw', '42');
  });
});
