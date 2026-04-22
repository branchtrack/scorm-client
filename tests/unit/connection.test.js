import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient.init (SCORM 1.2)', () => {
  let api;

  beforeEach(() => { api = mockApi12(); window.API = api; });
  afterEach(() => { delete window.API; });

  it('returns true and sets isActive on success', () => {
    const client = new ScormClient({ version: '1.2' });
    expect(client.init()).toBe(true);
    expect(client.isActive).toBe(true);
    expect(api.LMSInitialize).toHaveBeenCalledWith('');
  });

  it('returns false when LMSInitialize returns "false"', () => {
    api.LMSInitialize.mockReturnValue('false');
    const client = new ScormClient({ version: '1.2' });
    expect(client.init()).toBe(false);
    expect(client.isActive).toBe(false);
  });

  it('returns false when error code is non-zero after init', () => {
    api.LMSGetLastError.mockReturnValue('101');
    const client = new ScormClient({ version: '1.2' });
    expect(client.init()).toBe(false);
    expect(client.isActive).toBe(false);
  });

  it('returns false when called a second time (already active)', () => {
    const client = new ScormClient({ version: '1.2' });
    client.init();
    expect(client.init()).toBe(false);
    expect(api.LMSInitialize).toHaveBeenCalledTimes(1);
  });

  it('sets status to incomplete when initial status is "not attempted"', () => {
    api.LMSGetValue.mockReturnValue('not attempted');
    const client = new ScormClient({ version: '1.2' });
    client.init();
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'incomplete');
  });
});

describe('ScormClient.init (SCORM 2004)', () => {
  let api;

  beforeEach(() => { api = mockApi2004(); window.API_1484_11 = api; });
  afterEach(() => { delete window.API_1484_11; });

  it('returns true and calls Initialize', () => {
    const client = new ScormClient({ version: '2004' });
    expect(client.init()).toBe(true);
    expect(api.Initialize).toHaveBeenCalledWith('');
  });

  it('sets status to incomplete when initial status is "unknown"', () => {
    api.GetValue.mockReturnValue('unknown');
    const client = new ScormClient({ version: '2004' });
    client.init();
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'incomplete');
  });
});

describe('ScormClient.init — statusMode: success (SCORM 1.2)', () => {
  let api;

  beforeEach(() => { api = mockApi12(); window.API = api; });
  afterEach(() => { delete window.API; });

  it('writes "failed" on first launch when initial status is "not attempted"', () => {
    api.LMSGetValue.mockReturnValue('not attempted');
    const client = new ScormClient({ version: '1.2', statusMode: 'success' });
    client.init();
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'failed');
  });
});

describe('ScormClient.init — statusMode: success ignored on SCORM 2004', () => {
  let api;

  beforeEach(() => { api = mockApi2004(); window.API_1484_11 = api; });
  afterEach(() => { delete window.API_1484_11; });

  it('writes "incomplete" on first launch (success mode has no effect on 2004)', () => {
    api.GetValue.mockReturnValue('unknown');
    const client = new ScormClient({ version: '2004', statusMode: 'success' });
    client.init();
    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'incomplete');
  });
});

describe('ScormClient.init — no API', () => {
  it('returns false when no LMS API found on window', () => {
    const client = new ScormClient({ version: '1.2' });
    expect(client.init()).toBe(false);
  });
});

describe('ScormClient.quit (SCORM 1.2)', () => {
  let api;

  beforeEach(() => { api = mockApi12(); window.API = api; });
  afterEach(() => { delete window.API; });

  it('sets exit to "suspend" and calls LMSFinish when not completed', () => {
    const client = new ScormClient({ version: '1.2' });
    client.init();
    client.set('cmi.core.lesson_status', 'incomplete');
    expect(client.quit()).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.exit', 'suspend');
    expect(api.LMSFinish).toHaveBeenCalledWith('');
    expect(client.isActive).toBe(false);
  });

  it('sets exit to "" when completed', () => {
    const client = new ScormClient({ version: '1.2' });
    client.init();
    client.set('cmi.core.lesson_status', 'completed');
    client.quit();
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.exit', '');
  });

  it('returns false when not active', () => {
    const client = new ScormClient({ version: '1.2' });
    expect(client.quit()).toBe(false);
    expect(api.LMSFinish).not.toHaveBeenCalled();
  });
});

describe('ScormClient.quit (SCORM 2004)', () => {
  let api;

  beforeEach(() => { api = mockApi2004(); window.API_1484_11 = api; });
  afterEach(() => { delete window.API_1484_11; });

  it('sets exit to "suspend" and calls Terminate when not completed', () => {
    const client = new ScormClient({ version: '2004' });
    client.init();
    client.set('cmi.completion_status', 'incomplete');
    expect(client.quit()).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.exit', 'suspend');
    expect(api.Terminate).toHaveBeenCalledWith('');
  });

  it('sets exit to "normal" when completed', () => {
    const client = new ScormClient({ version: '2004' });
    client.init();
    client.set('cmi.completion_status', 'completed');
    client.quit();
    expect(api.SetValue).toHaveBeenCalledWith('cmi.exit', 'normal');
  });
});

describe('ScormClient - session time tracking (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    vi.useFakeTimers();
    api = mockApi12();
    window.API = api;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.API;
  });

  it('writes cmi.core.session_time on quit', () => {
    const client = new ScormClient({ version: '1.2' });
    client.init();
    vi.advanceTimersByTime(90_000); // 1m 30s
    client.quit();
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.session_time', '00:01:30');
  });

  it('formats hours and minutes correctly', () => {
    const client = new ScormClient({ version: '1.2' });
    client.init();
    vi.advanceTimersByTime(3_661_000); // 1h 1m 1s
    client.quit();
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.session_time', '01:01:01');
  });

  it('records zero time when quit immediately after init', () => {
    const client = new ScormClient({ version: '1.2' });
    client.init();
    client.quit();
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.session_time', '00:00:00');
  });
});

describe('ScormClient - session time tracking (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    vi.useFakeTimers();
    api = mockApi2004();
    window.API_1484_11 = api;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.API_1484_11;
  });

  it('writes cmi.session_time on quit', () => {
    const client = new ScormClient({ version: '2004' });
    client.init();
    vi.advanceTimersByTime(90_000); // 1m 30s
    client.quit();
    expect(api.SetValue).toHaveBeenCalledWith('cmi.session_time', 'PT0H1M30S');
  });

  it('formats hours and minutes correctly', () => {
    const client = new ScormClient({ version: '2004' });
    client.init();
    vi.advanceTimersByTime(3_661_000); // 1h 1m 1s
    client.quit();
    expect(api.SetValue).toHaveBeenCalledWith('cmi.session_time', 'PT1H1M1S');
  });

  it('records zero time when quit immediately after init', () => {
    const client = new ScormClient({ version: '2004' });
    client.init();
    client.quit();
    expect(api.SetValue).toHaveBeenCalledWith('cmi.session_time', 'PT0H0M0S');
  });
});

describe('ScormClient - handleSessionTime: false', () => {
  afterEach(() => {
    delete window.API;
    delete window.API_1484_11;
  });

  it('does not write session_time on quit (SCORM 1.2)', () => {
    const api = mockApi12();
    window.API = api;
    const client = new ScormClient({ version: '1.2', handleSessionTime: false });
    client.init();
    client.quit();
    const calls = api.LMSSetValue.mock.calls.map(([key]) => key);
    expect(calls).not.toContain('cmi.core.session_time');
  });

  it('does not write session_time on quit (SCORM 2004)', () => {
    const api = mockApi2004();
    window.API_1484_11 = api;
    const client = new ScormClient({ version: '2004', handleSessionTime: false });
    client.init();
    client.quit();
    const calls = api.SetValue.mock.calls.map(([key]) => key);
    expect(calls).not.toContain('cmi.session_time');
  });
});
