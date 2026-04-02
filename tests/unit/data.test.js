import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient.get (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('returns value from LMSGetValue', () => {
    api.LMSGetValue.mockReturnValue('completed');
    expect(client.get('cmi.core.lesson_status')).toBe('completed');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_status');
  });
});

describe('ScormClient.get — inactive connection (SCORM 1.2)', () => {
  afterEach(() => { delete window.API; });

  it('returns "null" string and does not call LMSGetValue', () => {
    const api = mockApi12();
    window.API = api;
    const inactive = new ScormClient({ version: '1.2' });
    // not calling init() — connection stays inactive
    expect(inactive.get('cmi.core.lesson_status')).toBe('null');
    expect(api.LMSGetValue).not.toHaveBeenCalled();
  });
});

describe('ScormClient.get (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('returns value from GetValue', () => {
    api.GetValue.mockReturnValue('incomplete');
    expect(client.get('cmi.completion_status')).toBe('incomplete');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.completion_status');
  });
});

describe('ScormClient.set (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('calls LMSSetValue and returns true', () => {
    expect(client.set('cmi.core.score.raw', '85')).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '85');
  });

  it('returns false when connection is inactive', () => {
    const inactive = new ScormClient({ version: '1.2' });
    expect(inactive.set('cmi.core.score.raw', '85')).toBe(false);
    expect(api.LMSSetValue).not.toHaveBeenCalled();
  });
});

describe('ScormClient.set (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('calls SetValue and returns true', () => {
    expect(client.set('cmi.score.raw', '90')).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.raw', '90');
  });
});

describe('ScormClient.save (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('calls LMSCommit and returns true', () => {
    expect(client.save()).toBe(true);
    expect(api.LMSCommit).toHaveBeenCalledWith('');
  });

  it('returns false when connection is inactive', () => {
    const inactive = new ScormClient({ version: '1.2' });
    expect(inactive.save()).toBe(false);
    expect(api.LMSCommit).not.toHaveBeenCalled();
  });
});

describe('ScormClient.save (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('calls Commit and returns true', () => {
    expect(client.save()).toBe(true);
    expect(api.Commit).toHaveBeenCalledWith('');
  });
});

// ── normalizeField ───────────────────────────────────────────────────────── //

describe('normalizeField — SCORM 1.2 (via get)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
    api.LMSGetValue.mockReturnValue('');
  });
  afterEach(() => { delete window.API; });

  it('lesson_status → cmi.core.lesson_status', () => {
    client.get('lesson_status');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_status');
  });

  it('score → cmi.core.score.raw', () => {
    client.get('score');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.score.raw');
  });

  it('score.raw → cmi.core.score.raw', () => {
    client.get('score.raw');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.score.raw');
  });

  it('score.min → cmi.core.score.min', () => {
    client.get('score.min');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.score.min');
  });

  it('score.max → cmi.core.score.max', () => {
    client.get('score.max');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.score.max');
  });

  it('score.scaled → cmi.core.score.scaled (default prefix)', () => {
    client.get('score.scaled');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.score.scaled');
  });

  it('lesson_location → cmi.core.lesson_location', () => {
    client.get('lesson_location');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_location');
  });

  it('location → cmi.core.lesson_location (alias)', () => {
    client.get('location');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_location');
  });

  it('suspend_data → cmi.suspend_data', () => {
    client.get('suspend_data');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.suspend_data');
  });

  it('exit → cmi.core.exit', () => {
    client.get('exit');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.exit');
  });

  it('learner_id → cmi.core.student_id (exception)', () => {
    client.get('learner_id');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.student_id');
  });

  it('learner_name → cmi.core.student_name (exception)', () => {
    client.get('learner_name');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.student_name');
  });

  it('student_name → cmi.core.student_name (default prefix)', () => {
    client.get('student_name');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.student_name');
  });

  it('lesson_mode → cmi.core.lesson_mode (default prefix)', () => {
    client.get('lesson_mode');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_mode');
  });

  it('cmi.* key passes through unchanged', () => {
    client.get('cmi.core.score.raw');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.score.raw');
  });

  it('unknown short key gets default cmi.core. prefix', () => {
    client.get('some_unknown_field');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.some_unknown_field');
  });
});

describe('normalizeField — SCORM 2004 (via get)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
    api.GetValue.mockReturnValue('');
  });
  afterEach(() => { delete window.API_1484_11; });

  it('lesson_status → cmi.completion_status', () => {
    client.get('lesson_status');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.completion_status');
  });

  it('score → cmi.score.raw', () => {
    client.get('score');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.score.raw');
  });

  it('score.raw → cmi.score.raw', () => {
    client.get('score.raw');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.score.raw');
  });

  it('score.min → cmi.score.min', () => {
    client.get('score.min');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.score.min');
  });

  it('score.max → cmi.score.max', () => {
    client.get('score.max');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.score.max');
  });

  it('score.scaled → cmi.score.scaled', () => {
    client.get('score.scaled');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.score.scaled');
  });

  it('lesson_location → cmi.location', () => {
    client.get('lesson_location');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.location');
  });

  it('suspend_data → cmi.suspend_data', () => {
    client.get('suspend_data');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.suspend_data');
  });

  it('exit → cmi.exit', () => {
    client.get('exit');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.exit');
  });

  it('learner_id → cmi.learner_id (default prefix)', () => {
    client.get('learner_id');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.learner_id');
  });

  it('learner_name → cmi.learner_name (default prefix)', () => {
    client.get('learner_name');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.learner_name');
  });

  it('student_id → cmi.learner_id (exception)', () => {
    client.get('student_id');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.learner_id');
  });

  it('student_name → cmi.learner_name (exception)', () => {
    client.get('student_name');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.learner_name');
  });

  it('completion_status → cmi.completion_status (default prefix)', () => {
    client.get('completion_status');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.completion_status');
  });

  it('unknown short key gets default cmi. prefix', () => {
    client.get('some_unknown_field');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.some_unknown_field');
  });

  it('cmi.* key passes through unchanged', () => {
    client.get('cmi.score.raw');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.score.raw');
  });
});

describe('normalizeField — via set()', () => {
  it('normalizes short key in set() — SCORM 1.2', () => {
    const api = mockApi12();
    window.API = api;
    const client = new ScormClient({ version: '1.2' });
    client.init();
    client.set('score.raw', '85');
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '85');
    delete window.API;
  });

  it('normalizes short key in set() — SCORM 2004', () => {
    const api = mockApi2004();
    window.API_1484_11 = api;
    const client = new ScormClient({ version: '2004' });
    client.init();
    client.set('score.raw', '90');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.raw', '90');
    delete window.API_1484_11;
  });
});
