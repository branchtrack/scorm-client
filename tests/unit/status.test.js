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

// ── Status validation (invalid values) ───────────────────────────────────── //

describe('ScormClient.status — invalid value rejected (SCORM 1.2)', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('returns false for unknown value "bogus"', () => {
    expect(client.status('bogus')).toBe(false);
  });
  it('does not forward invalid value to LMS', () => {
    client.status('bogus');
    expect(api.LMSSetValue).not.toHaveBeenCalledWith('cmi.core.lesson_status', 'bogus');
  });
  it('"unknown" is rejected (not a 1.2 value)', () => {
    expect(client.status('unknown')).toBe(false);
  });
});

describe('ScormClient.status — invalid value rejected (SCORM 2004)', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('returns false for unknown value "bogus"', () => {
    expect(client.status('bogus')).toBe(false);
  });
  it('does not forward invalid value to LMS', () => {
    client.status('bogus');
    expect(api.SetValue).not.toHaveBeenCalledWith('cmi.completion_status', 'bogus');
  });
  it('"browsed" is rejected (not a 2004 value)', () => {
    expect(client.status('browsed')).toBe(false);
  });
});

describe('ScormClient.success — invalid value rejected (SCORM 2004)', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('returns false for unknown value "bogus"', () => {
    expect(client.success('bogus')).toBe(false);
  });
  it('"completed" is rejected for success_status', () => {
    expect(client.success('completed')).toBe(false);
  });
  it('valid value "passed" is accepted', () => {
    expect(client.success('passed')).toBe(true);
  });
});

// ── status(true/false) — completion mode (default) ──────────────────────────────────────── //

describe('ScormClient.status(bool) — statusMode: completion — SCORM 1.2', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('status(true) writes "completed"', () => {
    expect(client.status(true)).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'completed');
  });

  it('status(false) writes "incomplete"', () => {
    expect(client.status(false)).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'incomplete');
  });
});

describe('ScormClient.status(bool) — statusMode: completion — SCORM 2004', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('status(true) writes "completed"', () => {
    expect(client.status(true)).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed');
  });

  it('status(false) writes "incomplete"', () => {
    expect(client.status(false)).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'incomplete');
  });
});

// ── status(true/false) — success mode ─────────────────────────────────────────────────── //

describe('ScormClient.status(bool) — statusMode: success — SCORM 1.2', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2', statusMode: 'success' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('status(true) writes "passed"', () => {
    expect(client.status(true)).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'passed');
  });

  it('status(false) writes "failed"', () => {
    expect(client.status(false)).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'failed');
  });
});

describe('ScormClient.status(bool) — statusMode: success — SCORM 2004 falls back', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004', statusMode: 'success' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('status(true) falls back to "completed" (2004 does not support success mode)', () => {
    expect(client.status(true)).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed');
  });

  it('status(false) falls back to "incomplete"', () => {
    expect(client.status(false)).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'incomplete');
  });
});

// ── status(true/false) — array form ──────────────────────────────────────────────────────── //

describe('ScormClient.status(bool) — statusMode: array — SCORM 1.2', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2', statusMode: ['completed', 'failed'] });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('status(true) writes the first array element', () => {
    expect(client.status(true)).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'completed');
  });

  it('status(false) writes the second array element', () => {
    expect(client.status(false)).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'failed');
  });
});

describe('ScormClient.status(bool) — statusMode: array — SCORM 2004', () => {
  let api, client;
  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004', statusMode: ['completed', 'incomplete'] });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('status(true) writes the first array element', () => {
    expect(client.status(true)).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed');
  });

  it('status(false) writes the second array element', () => {
    expect(client.status(false)).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'incomplete');
  });
});
