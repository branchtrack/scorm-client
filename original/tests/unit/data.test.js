import { describe, it, expect, beforeEach } from 'vitest';
import pipwerks from '../../src/scorm_api_wrapper.js';
import { resetScorm, mockApi12, mockApi2004 } from '../helpers/mockLms.js';

function injectApi(api) {
  pipwerks.SCORM.API.handle = api;
  pipwerks.SCORM.API.isFound = true;
}

describe('SCORM.data.get (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('returns value from LMSGetValue', () => {
    api.LMSGetValue.mockReturnValue('completed');

    const result = pipwerks.SCORM.data.get('cmi.core.lesson_status');

    expect(result).toBe('completed');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_status');
  });

  it('caches completionStatus when getting lesson_status', () => {
    api.LMSGetValue.mockReturnValue('passed');

    pipwerks.SCORM.data.get('cmi.core.lesson_status');

    expect(pipwerks.SCORM.data.completionStatus).toBe('passed');
  });

  it('caches exitStatus when getting core.exit', () => {
    api.LMSGetValue.mockReturnValue('suspend');

    pipwerks.SCORM.data.get('cmi.core.exit');

    expect(pipwerks.SCORM.data.exitStatus).toBe('suspend');
  });

  it('returns "null" string when connection is inactive', () => {
    pipwerks.SCORM.connection.isActive = false;

    const result = pipwerks.SCORM.data.get('cmi.core.lesson_status');

    expect(result).toBe('null');
    expect(api.LMSGetValue).not.toHaveBeenCalled();
  });
});

describe('SCORM.data.get (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('returns value from GetValue', () => {
    api.GetValue.mockReturnValue('completed');

    const result = pipwerks.SCORM.data.get('cmi.completion_status');

    expect(result).toBe('completed');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.completion_status');
  });

  it('caches completionStatus when getting completion_status', () => {
    api.GetValue.mockReturnValue('incomplete');

    pipwerks.SCORM.data.get('cmi.completion_status');

    expect(pipwerks.SCORM.data.completionStatus).toBe('incomplete');
  });
});

describe('SCORM.data.set (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('calls LMSSetValue and returns true', () => {
    const result = pipwerks.SCORM.data.set('cmi.core.score.raw', '85');

    expect(result).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '85');
  });

  it('caches completionStatus when setting lesson_status', () => {
    pipwerks.SCORM.data.set('cmi.core.lesson_status', 'completed');

    expect(pipwerks.SCORM.data.completionStatus).toBe('completed');
  });

  it('returns false when connection is inactive', () => {
    pipwerks.SCORM.connection.isActive = false;

    const result = pipwerks.SCORM.data.set('cmi.core.score.raw', '85');

    expect(result).toBe(false);
    expect(api.LMSSetValue).not.toHaveBeenCalled();
  });
});

describe('SCORM.data.set (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('calls SetValue and returns true', () => {
    const result = pipwerks.SCORM.data.set('cmi.score.raw', '90');

    expect(result).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.raw', '90');
  });
});

describe('SCORM.data.save (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('calls LMSCommit and returns true', () => {
    const result = pipwerks.SCORM.data.save();

    expect(result).toBe(true);
    expect(api.LMSCommit).toHaveBeenCalledWith('');
  });

  it('returns false when connection is inactive', () => {
    pipwerks.SCORM.connection.isActive = false;

    const result = pipwerks.SCORM.data.save();

    expect(result).toBe(false);
    expect(api.LMSCommit).not.toHaveBeenCalled();
  });
});

describe('SCORM.data.save (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('calls Commit and returns true', () => {
    const result = pipwerks.SCORM.data.save();

    expect(result).toBe(true);
    expect(api.Commit).toHaveBeenCalledWith('');
  });
});
