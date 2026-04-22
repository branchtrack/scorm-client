import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient.success (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });

  afterEach(() => { delete window.API; });

  it('success() returns false — not supported in 1.2', () => {
    expect(client.success()).toBe(false);
  });

  it('success(true) returns false — not supported in 1.2', () => {
    expect(client.success(true)).toBe(false);
  });

  it('success(false) returns false — not supported in 1.2', () => {
    expect(client.success(false)).toBe(false);
  });

  it('success() does not call the LMS API', () => {
    api.LMSGetValue.mockClear();
    api.LMSSetValue.mockClear();
    client.success();
    expect(api.LMSGetValue).not.toHaveBeenCalled();
    expect(api.LMSSetValue).not.toHaveBeenCalled();
  });
});

describe('ScormClient.success (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });

  afterEach(() => { delete window.API_1484_11; });

  it('success() get calls cmi.success_status', () => {
    client.success();
    expect(api.GetValue).toHaveBeenCalledWith('cmi.success_status');
  });

  it('success(true) sets "passed"', () => {
    client.success(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.success_status', 'passed');
  });

  it('success(false) sets "failed"', () => {
    client.success(false);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.success_status', 'failed');
  });

  it('success(string) sets value directly', () => {
    client.success('unknown');
    expect(api.SetValue).toHaveBeenCalledWith('cmi.success_status', 'unknown');
  });

  it('success(true) returns true on success', () => {
    expect(client.success(true)).toBe(true);
  });
});
