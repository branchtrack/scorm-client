import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient.location (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });

  afterEach(() => { delete window.API; });

  it('location() get calls cmi.core.lesson_location', () => {
    api.LMSGetValue.mockReturnValueOnce('slide-5');
    client.location();
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_location');
  });

  it('location(value) set calls cmi.core.lesson_location', () => {
    client.location('slide-12');
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_location', 'slide-12');
  });

  it('location() returns the current bookmark string', () => {
    api.LMSGetValue.mockReturnValueOnce('slide-5');
    expect(client.location()).toBe('slide-5');
  });

  it('location(value) returns true on success', () => {
    expect(client.location('slide-3')).toBe(true);
  });
});

describe('ScormClient.location (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });

  afterEach(() => { delete window.API_1484_11; });

  it('location() get calls cmi.location', () => {
    api.GetValue.mockReturnValueOnce('module-2');
    client.location();
    expect(api.GetValue).toHaveBeenCalledWith('cmi.location');
  });

  it('location(value) set calls cmi.location', () => {
    client.location('module-2');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.location', 'module-2');
  });

  it('location() returns the current bookmark string', () => {
    api.GetValue.mockReturnValueOnce('module-2');
    expect(client.location()).toBe('module-2');
  });

  it('location(value) returns true on success', () => {
    expect(client.location('module-3')).toBe(true);
  });
});
