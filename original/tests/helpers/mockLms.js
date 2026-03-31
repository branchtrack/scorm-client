import { vi } from 'vitest';

export function mockApi12() {
  return {
    LMSInitialize: vi.fn(() => 'true'),
    LMSFinish: vi.fn(() => 'true'),
    LMSGetValue: vi.fn(() => ''),
    LMSSetValue: vi.fn(() => 'true'),
    LMSCommit: vi.fn(() => 'true'),
    LMSGetLastError: vi.fn(() => '0'),
    LMSGetErrorString: vi.fn(() => ''),
    LMSGetDiagnostic: vi.fn(() => ''),
  };
}

export function mockApi2004() {
  return {
    Initialize: vi.fn(() => 'true'),
    Terminate: vi.fn(() => 'true'),
    GetValue: vi.fn(() => ''),
    SetValue: vi.fn(() => 'true'),
    Commit: vi.fn(() => 'true'),
    GetLastError: vi.fn(() => '0'),
    GetErrorString: vi.fn(() => ''),
    GetDiagnostic: vi.fn(() => ''),
  };
}

export function resetScorm(pipwerks) {
  pipwerks.SCORM.version = null;
  pipwerks.SCORM.handleCompletionStatus = true;
  pipwerks.SCORM.handleExitMode = true;
  pipwerks.SCORM.API.handle = null;
  pipwerks.SCORM.API.isFound = false;
  pipwerks.SCORM.connection.isActive = false;
  pipwerks.SCORM.data.completionStatus = null;
  pipwerks.SCORM.data.exitStatus = null;
}
