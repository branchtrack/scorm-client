import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScormClient from '../../src/scorm_client.js';
import { mockApi2004 } from '../helpers/mockLms.js';

describe('ScormClient SCORM 2004 full lifecycle', () => {
  let api;

  beforeEach(() => { api = mockApi2004(); window.API_1484_11 = api; });
  afterEach(() => { delete window.API_1484_11; });

  it('completes a full SCORM 2004 session', () => {
    const client = new ScormClient();

    // Initialize
    expect(client.init()).toBe(true);
    expect(api.Initialize).toHaveBeenCalledWith('');
    expect(client.version).toBe('2004');
    expect(client.isActive).toBe(true);

    // Get completion status
    api.GetValue.mockReturnValue('incomplete');
    expect(client.get('cmi.completion_status')).toBe('incomplete');
    expect(api.GetValue).toHaveBeenCalledWith('cmi.completion_status');

    // Set score
    expect(client.set('cmi.score.raw', '95')).toBe(true);
    expect(api.SetValue).toHaveBeenCalledWith('cmi.score.raw', '95');

    // Set completion status
    expect(client.set('cmi.completion_status', 'completed')).toBe(true);

    // Save
    expect(client.save()).toBe(true);
    expect(api.Commit).toHaveBeenCalledWith('');

    // Terminate
    expect(client.quit()).toBe(true);
    expect(api.Terminate).toHaveBeenCalledWith('');
    expect(client.isActive).toBe(false);
  });
});
