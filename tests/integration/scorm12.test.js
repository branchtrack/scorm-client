import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi12 } from '../helpers/mockLms.js';

describe('ScormClient SCORM 1.2 full lifecycle', () => {
  let api;

  beforeEach(() => { api = mockApi12(); window.API = api; });
  afterEach(() => { delete window.API; });

  it('completes a full SCORM 1.2 session', () => {
    const client = new ScormClient();

    // Initialize
    expect(client.init()).toBe(true);
    expect(api.LMSInitialize).toHaveBeenCalledWith('');
    expect(client.version).toBe('1.2');
    expect(client.isActive).toBe(true);

    // Get completion status
    api.LMSGetValue.mockReturnValue('incomplete');
    expect(client.get('cmi.core.lesson_status')).toBe('incomplete');
    expect(api.LMSGetValue).toHaveBeenCalledWith('cmi.core.lesson_status');

    // Set score
    expect(client.set('cmi.core.score.raw', '95')).toBe(true);
    expect(api.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '95');

    // Set completion status
    expect(client.set('cmi.core.lesson_status', 'completed')).toBe(true);

    // Save
    expect(client.save()).toBe(true);
    expect(api.LMSCommit).toHaveBeenCalledWith('');

    // Terminate
    expect(client.quit()).toBe(true);
    expect(api.LMSFinish).toHaveBeenCalledWith('');
    expect(client.isActive).toBe(false);
  });
});
