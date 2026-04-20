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

  // SCORM 1.2 has no separate `success_status` element. Passed/failed lives
  // on `cmi.core.lesson_status`. The wrapper transparently routes success()
  // calls there for 1.2 content.

  it('success() get reads cmi.core.lesson_status', () => {
    client.success();
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_status');
  });

  it('success(true) sets lesson_status to "passed"', () => {
    client.success(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'passed');
  });

  it('success(false) sets lesson_status to "failed"', () => {
    client.success(false);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'failed');
  });

  it('success(string) sets lesson_status directly', () => {
    client.success('passed');
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'passed');
  });

  it('success(true) returns true on success', () => {
    expect(client.success(true)).toBe(true);
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
