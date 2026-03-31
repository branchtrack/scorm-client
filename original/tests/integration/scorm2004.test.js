import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import pipwerks from '../../src/scorm_api_wrapper.js';
import { resetScorm, mockApi2004 } from '../helpers/mockLms.js';

describe('SCORM 2004 full lifecycle', () => {
  let api;

  beforeEach(() => {
    resetScorm(pipwerks);
    api = mockApi2004();
    window.API_1484_11 = api;
  });

  afterEach(() => {
    delete window.API_1484_11;
  });

  it('completes a full SCORM 2004 session', () => {
    // Initialize
    const initialized = pipwerks.SCORM.init();
    expect(initialized).toBe(true);
    expect(api.Initialize).toHaveBeenCalledWith('');
    expect(pipwerks.SCORM.version).toBe('2004');
    expect(pipwerks.SCORM.connection.isActive).toBe(true);

    // Get completion status
    api.GetValue.mockReturnValue('incomplete');
    const status = pipwerks.SCORM.get('cmi.completion_status');
    expect(status).toBe('incomplete');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.completion_status');

    // Set score
    const scored = pipwerks.SCORM.set('cmi.score.raw', '95');
    expect(scored).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.raw', '95');

    // Set completion status
    const completed = pipwerks.SCORM.set('cmi.completion_status', 'completed');
    expect(completed).toBe(true);
    expect(pipwerks.SCORM.data.completionStatus).toBe('completed');

    // Save
    const saved = pipwerks.SCORM.save();
    expect(saved).toBe(true);
    expect(api.Commit).toHaveBeenCalledWith('');

    // Terminate
    const terminated = pipwerks.SCORM.quit();
    expect(terminated).toBe(true);
    expect(api.Terminate).toHaveBeenCalledWith('');
    expect(pipwerks.SCORM.connection.isActive).toBe(false);
  });
});
