import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient.status (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('get returns value via cmi.core.lesson_status', () => {
    api.LMSGetValue.mockReturnValue('completed');
    expect(client.status()).toBe('completed');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_status');
  });

  it('set calls LMSSetValue with cmi.core.lesson_status', () => {
    expect(client.status('completed')).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'completed');
  });

  it('returns false when status value is null', () => {
    expect(client.status(null)).toBe(false);
  });
});

describe('ScormClient.status (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('get returns value via cmi.completion_status', () => {
    api.GetValue.mockReturnValue('incomplete');
    expect(client.status()).toBe('incomplete');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.completion_status');
  });

  it('set calls SetValue with cmi.completion_status', () => {
    client.status('completed');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed');
  });
});

describe('ScormClient.completion (alias for status)', () => {
  it('completion() delegates to status() — SCORM 1.2', () => {
    const api = mockApi12();
    window.API = api;
    const client = new ScormClient({ version: '1.2' });
    client.init();
    client.completion('completed');
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'completed');
    delete window.API;
  });

  it('completion() delegates to status() — SCORM 2004', () => {
    const api = mockApi2004();
    window.API_1484_11 = api;
    const client = new ScormClient({ version: '2004' });
    client.init();
    client.completion('completed');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed');
    delete window.API_1484_11;
  });
});
