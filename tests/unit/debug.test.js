import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12, mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient.getLastError (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('returns 0 when no error', () => {
    expect(client.getLastError()).toBe(0);
    expect(api.LMSGetLastError).toHaveBeenCalled();
  });

  it('returns integer error code', () => {
    api.LMSGetLastError.mockReturnValue('201');
    expect(client.getLastError()).toBe(201);
  });
});

describe('ScormClient.getLastError (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('returns integer error code from GetLastError', () => {
    api.GetLastError.mockReturnValue('101');
    expect(client.getLastError()).toBe(101);
  });
});

describe('ScormClient.getLastError — no API', () => {
  it('returns 0 when API not found', () => {
    const client = new ScormClient({ version: '1.2' });
    expect(client.getLastError()).toBe(0);
  });
});

describe('ScormClient.getErrorInfo (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('returns error string from LMSGetErrorString', () => {
    api.LMSGetErrorString.mockReturnValue('Invalid argument error');
    expect(client.getErrorInfo(201)).toBe('Invalid argument error');
    expect(api.LMSGetErrorString).toHaveBeenCalledWith('201');
  });
});

describe('ScormClient.getErrorInfo (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('returns error string from GetErrorString', () => {
    api.GetErrorString.mockReturnValue('General exception');
    expect(client.getErrorInfo(101)).toBe('General exception');
    expect(api.GetErrorString).toHaveBeenCalledWith('101');
  });
});

describe('ScormClient.getDiagnosticInfo (SCORM 1.2)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi12();
    window.API = api;
    client = new ScormClient({ version: '1.2' });
    client.init();
  });
  afterEach(() => { delete window.API; });

  it('calls LMSGetDiagnostic and returns result', () => {
    api.LMSGetDiagnostic.mockReturnValue('Diagnostic info');
    expect(client.getDiagnosticInfo(201)).toBe('Diagnostic info');
    expect(api.LMSGetDiagnostic).toHaveBeenCalledWith('201');
  });
});

describe('ScormClient.getDiagnosticInfo (SCORM 2004)', () => {
  let api, client;

  beforeEach(() => {
    api = mockApi2004();
    window.API_1484_11 = api;
    client = new ScormClient({ version: '2004' });
    client.init();
  });
  afterEach(() => { delete window.API_1484_11; });

  it('calls GetDiagnostic and returns result', () => {
    api.GetDiagnostic.mockReturnValue('Diagnostic detail');
    expect(client.getDiagnosticInfo(101)).toBe('Diagnostic detail');
    expect(api.GetDiagnostic).toHaveBeenCalledWith('101');
  });
});
