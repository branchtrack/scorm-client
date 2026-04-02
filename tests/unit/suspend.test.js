import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient.suspend / resume (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });

  afterEach(() => { delete window.API; });

  it('suspend() stores an object as JSON string', () => {
    client.suspend({ page: 3, answers: [1, 0, 2] });
    expect(api.LMSSetValue).toHaveBeenCalledWith(
      'cmi.suspend_data',
      JSON.stringify({ page: 3, answers: [1, 0, 2] })
    );
  });

  it('suspend() stores a string as-is (no double serialization)', () => {
    client.suspend('my raw string');
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.suspend_data', 'my raw string');
  });

  it('resume() returns parsed object', () => {
    api.LMSGetValue.mockReturnValueOnce(JSON.stringify({ page: 3 }));
    const result = client.resume();
    expect(result).toEqual({ page: 3 });
  });

  it('resume() returns null when suspend_data is empty', () => {
    // default mock returns '' — no override needed
    const result = client.resume();
    expect(result).toBeNull();
  });

  it('resume() returns raw string when JSON is invalid', () => {
    api.LMSGetValue.mockReturnValueOnce('not valid json {{{');
    const result = client.resume();
    expect(result).toBe('not valid json {{{');
  });

  it('suspend_data uses cmi.suspend_data (not cmi.core) for SCORM 1.2', () => {
    client.suspend({ x: 1 });
    const [field] = api.LMSSetValue.mock.calls.at(-1);
    expect(field).toBe('cmi.suspend_data');
  });
});

describe('ScormClient.suspend / resume (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });

  afterEach(() => { delete window.API_1484_11; });

  it('suspend() stores an object as JSON string', () => {
    client.suspend({ slide: 'intro', score: 42 });
    expect(api.SetValue).toHaveBeenCalledWith(
      'cmi.suspend_data',
      JSON.stringify({ slide: 'intro', score: 42 })
    );
  });

  it('suspend() stores a string as-is', () => {
    client.suspend('raw');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.suspend_data', 'raw');
  });

  it('resume() returns parsed object', () => {
    api.GetValue.mockReturnValueOnce(JSON.stringify({ slide: 'intro' }));
    const result = client.resume();
    expect(result).toEqual({ slide: 'intro' });
  });

  it('resume() returns null when suspend_data is empty', () => {
    // default mock returns '' — no override needed
    const result = client.resume();
    expect(result).toBeNull();
  });

  it('resume() returns raw string when JSON is invalid', () => {
    api.GetValue.mockReturnValueOnce('bad data');
    const result = client.resume();
    expect(result).toBe('bad data');
  });

  it('suspend() returns false when not connected', () => {
    client.quit();
    const result = client.suspend({ x: 1 });
    expect(result).toBe(false);
  });
});
