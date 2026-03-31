import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import pipwerks from '../../src/scorm_api_wrapper.js';
import { resetScorm, mockApi12 } from '../helpers/mockLms.js';

describe('SCORM 1.2 full lifecycle', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    api = mockApi12();
    window.API = api;
  });

  afterEach(() => {
    delete window.API;
  });

  it('completes a full SCORM 1.2 session', () => {
    // Initialize
    const initialized = pipwerks.SCORM.init();
    expect(initialized).toBe(true);
    expect(api.LMSInitialize).toHaveBeenCalledWith('');
    expect(pipwerks.SCORM.version).toBe('1.2');
    expect(pipwerks.SCORM.connection.isActive).toBe(true);

    // Get completion status
    api.LMSGetValue.mockReturnValue('incomplete');
    const status = pipwerks.SCORM.get('cmi.core.lesson_status');
    expect(status).toBe('incomplete');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_status');

    // Set score
    const scored = pipwerks.SCORM.set('cmi.core.score.raw', '95');
    expect(scored).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '95');

    // Set completion status
    const completed = pipwerks.SCORM.set('cmi.core.lesson_status', 'completed');
    expect(completed).toBe(true);
    expect(pipwerks.SCORM.data.completionStatus).toBe('completed');

    // Save
    const saved = pipwerks.SCORM.save();
    expect(saved).toBe(true);
    expect(api.LMSCommit).toHaveBeenCalledWith('');

    // Terminate
    const terminated = pipwerks.SCORM.quit();
    expect(terminated).toBe(true);
    expect(api.LMSFinish).toHaveBeenCalledWith('');
    expect(pipwerks.SCORM.connection.isActive).toBe(false);
  });
});
