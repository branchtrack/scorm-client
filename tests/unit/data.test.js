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
