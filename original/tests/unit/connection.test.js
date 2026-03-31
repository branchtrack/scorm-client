import { describe, it, expect, beforeEach } from 'vitest';
import pipwerks from '../../src/scorm_api_wrapper.js';
import { resetScorm, mockApi12, mockApi2004 } from '../helpers/mockLms.js';

function injectApi(api) {
  pipwerks.SCORM.API.handle = api;
  pipwerks.SCORM.API.isFound = true;
}

describe('SCORM.connection.initialize (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
  });

  it('returns true and sets connection active on success', () => {
    const result = pipwerks.SCORM.connection.initialize();

    expect(result).toBe(true);
    expect(pipwerks.SCORM.connection.isActive).toBe(true);
    expect(api.LMSInitialize).toHaveBeenCalledWith('');
  });

  it('returns false when LMSInitialize returns "false"', () => {
    api.LMSInitialize.mockReturnValue('false');

    const result = pipwerks.SCORM.connection.initialize();

    expect(result).toBe(false);
    expect(pipwerks.SCORM.connection.isActive).toBe(false);
  });

  it('returns false when error code is non-zero after init', () => {
    api.LMSGetLastError.mockReturnValue('101');

    const result = pipwerks.SCORM.connection.initialize();

    expect(result).toBe(false);
    expect(pipwerks.SCORM.connection.isActive).toBe(false);
  });

  it('does not call LMSInitialize when connection already active', () => {
    pipwerks.SCORM.connection.isActive = true;

    const result = pipwerks.SCORM.connection.initialize();

    expect(result).toBe(false);
    expect(api.LMSInitialize).not.toHaveBeenCalled();
  });

  it('returns false when API is null', () => {
    pipwerks.SCORM.API.handle = null;
    pipwerks.SCORM.API.isFound = false;

    expect(pipwerks.SCORM.connection.initialize()).toBe(false);
  });

  it('sets status to incomplete when initial status is "not attempted"', () => {
    api.LMSGetValue.mockReturnValue('not attempted');

    pipwerks.SCORM.connection.initialize();

    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'incomplete');
  });
});

describe('SCORM.connection.initialize (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
  });

  it('returns true and sets connection active on success', () => {
    const result = pipwerks.SCORM.connection.initialize();

    expect(result).toBe(true);
    expect(pipwerks.SCORM.connection.isActive).toBe(true);
    expect(api.Initialize).toHaveBeenCalledWith('');
  });

  it('sets status to incomplete when initial status is "unknown"', () => {
    api.GetValue.mockReturnValue('unknown');

    pipwerks.SCORM.connection.initialize();

    expect(api.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'incomplete');
  });
});

describe('SCORM.connection.terminate (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('sets exit to "suspend" and calls LMSFinish when not completed', () => {
    pipwerks.SCORM.data.completionStatus = 'incomplete';

    const result = pipwerks.SCORM.connection.terminate();

    expect(result).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.exit', 'suspend');
    expect(api.LMSFinish).toHaveBeenCalledWith('');
    expect(pipwerks.SCORM.connection.isActive).toBe(false);
  });

  it('sets exit to "logout" when completed', () => {
    pipwerks.SCORM.data.completionStatus = 'completed';

    pipwerks.SCORM.connection.terminate();

    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.exit', 'logout');
  });

  it('returns false when connection is not active', () => {
    pipwerks.SCORM.connection.isActive = false;

    const result = pipwerks.SCORM.connection.terminate();

    expect(result).toBe(false);
    expect(api.LMSFinish).not.toHaveBeenCalled();
  });
});

describe('SCORM.connection.terminate (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
    pipwerks.SCORM.connection.isActive = true;
  });

  it('sets exit to "suspend" and calls Terminate when not completed', () => {
    pipwerks.SCORM.data.completionStatus = 'incomplete';

    const result = pipwerks.SCORM.connection.terminate();

    expect(result).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.exit', 'suspend');
    expect(api.Terminate).toHaveBeenCalledWith('');
    expect(pipwerks.SCORM.connection.isActive).toBe(false);
  });

  it('sets exit to "normal" when completed', () => {
    pipwerks.SCORM.data.completionStatus = 'completed';

    pipwerks.SCORM.connection.terminate();

    expect(api.SetValue).toHaveBeenCalledWith('cmi.exit', 'normal');
  });
});
