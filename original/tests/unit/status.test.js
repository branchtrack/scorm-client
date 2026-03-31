import { describe, it, expect, beforeEach } from 'vitest';
import pipwerks from '../../src/scorm_api_wrapper.js';
import { resetScorm, mockApi12, mockApi2004 } from '../helpers/mockLms.js';

function injectApi(api) {
  pipwerks.SCORM.API.handle = api;
  pipwerks.SCORM.API.isFound = true;
}

describe('SCORM.status (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('get returns value via cmi.core.lesson_status', () => {
    api.LMSGetValue.mockReturnValue('completed');

    const result = pipwerks.SCORM.status('get');

    expect(result).toBe('completed');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_status');
  });

  it('set calls data.set with cmi.core.lesson_status', () => {
    const result = pipwerks.SCORM.status('set', 'completed');

    expect(result).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'completed');
  });

  it('returns false when action is null', () => {
    expect(pipwerks.SCORM.status(null)).toBe(false);
  });

  it('returns false when status is null on set', () => {
    expect(pipwerks.SCORM.status('set', null)).toBe(false);
  });

  it('returns false for unknown action', () => {
    expect(pipwerks.SCORM.status('invalid')).toBe(false);
  });
});

describe('SCORM.status (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('get returns value via cmi.completion_status', () => {
    api.GetValue.mockReturnValue('incomplete');

    const result = pipwerks.SCORM.status('get');

    expect(result).toBe('incomplete');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.completion_status');
  });

  it('set calls data.set with cmi.completion_status', () => {
    pipwerks.SCORM.status('set', 'completed');

    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed');
  });
});
