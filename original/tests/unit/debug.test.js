import { describe, it, expect, beforeEach } from 'vitest';
import pipwerks from '../../src/scorm_api_wrapper.js';
import { resetScorm, mockApi12, mockApi2004 } from '../helpers/mockLms.js';

function injectApi(api) {
  pipwerks.SCORM.API.handle = api;
  pipwerks.SCORM.API.isFound = true;
}

describe('SCORM.debug.getCode (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
  });

  it('returns integer error code from LMSGetLastError', () => {
    api.LMSGetLastError.mockReturnValue('201');

    const result = pipwerks.SCORM.debug.getCode();

    expect(result).toBe(201);
    expect(api.LMSGetLastError).toHaveBeenCalled();
  });

  it('returns 0 when no error', () => {
    expect(pipwerks.SCORM.debug.getCode()).toBe(0);
  });
});

describe('SCORM.debug.getCode (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
  });

  it('returns integer error code from GetLastError', () => {
    api.GetLastError.mockReturnValue('101');

    const result = pipwerks.SCORM.debug.getCode();

    expect(result).toBe(101);
    expect(api.GetLastError).toHaveBeenCalled();
  });
});

describe('SCORM.debug.getCode — no API', () => {
  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
  });

  it('returns 0 when API handle is null', () => {
    expect(pipwerks.SCORM.debug.getCode()).toBe(0);
  });
});

describe('SCORM.debug.getInfo (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
  });

  it('returns error string from LMSGetErrorString', () => {
    api.LMSGetErrorString.mockReturnValue('Invalid argument error');

    const result = pipwerks.SCORM.debug.getInfo(201);

    expect(result).toBe('Invalid argument error');
    expect(api.LMSGetErrorString).toHaveBeenCalledWith('201');
  });
});

describe('SCORM.debug.getInfo (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
  });

  it('returns error string from GetErrorString', () => {
    api.GetErrorString.mockReturnValue('General exception');

    const result = pipwerks.SCORM.debug.getInfo(101);

    expect(result).toBe('General exception');
    expect(api.GetErrorString).toHaveBeenCalledWith('101');
  });
});

describe('SCORM.debug.getDiagnosticInfo (SCORM 1.2)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '1.2';
    api = mockApi12();
    injectApi(api);
  });

  it('calls LMSGetDiagnostic and returns result', () => {
    api.LMSGetDiagnostic.mockReturnValue('Diagnostic info');

    const result = pipwerks.SCORM.debug.getDiagnosticInfo(201);

    expect(result).toBe('Diagnostic info');
    expect(api.LMSGetDiagnostic).toHaveBeenCalledWith(201);
  });
});

describe('SCORM.debug.getDiagnosticInfo (SCORM 2004)', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    pipwerks.SCORM.version = '2004';
    api = mockApi2004();
    injectApi(api);
  });

  it('calls GetDiagnostic and returns result', () => {
    api.GetDiagnostic.mockReturnValue('Diagnostic detail');

    const result = pipwerks.SCORM.debug.getDiagnosticInfo(101);

    expect(result).toBe('Diagnostic detail');
    expect(api.GetDiagnostic).toHaveBeenCalledWith(101);
  });
});
