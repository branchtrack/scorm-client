import { describe, it, expect, vi } from 'vitest';
import { isValidVersion, normalizeField, stringToBoolean, formatSessionTime } from '../../src/utils.js';

// ── normalizeField ────────────────────────────────────────────────────────── //

// ── isValidVersion ───────────────────────────────────────────────────────── //

describe('isValidVersion', () => {
  it('returns true for "1.2"',  () => expect(isValidVersion('1.2')).toBe(true));
  it('returns true for "2004"', () => expect(isValidVersion('2004')).toBe(true));
  it('returns false for "1.3"', () => expect(isValidVersion('1.3')).toBe(false));
  it('returns false for null',  () => expect(isValidVersion(null)).toBe(false));
  it('returns false for empty string', () => expect(isValidVersion('')).toBe(false));

  it('warns when version is invalid', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    isValidVersion('bad');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not warn when version is valid', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    isValidVersion('1.2');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ── normalizeField ────────────────────────────────────────────────────────── //

describe('normalizeField — invalid version', () => {
  it('returns null for an unknown version string', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeField('1.3', 'score')).toBeNull();
    spy.mockRestore();
  });

  it('returns null for null version', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeField(null, 'score')).toBeNull();
    spy.mockRestore();
  });

  it('logs a console warning with the bad version', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    normalizeField('unknown', 'score');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('unknown'));
    spy.mockRestore();
  });
});

describe('normalizeField — pass-through', () => {
  it('returns key unchanged when it starts with cmi.', () => {
    expect(normalizeField('1.2',  'cmi.core.score.raw')).toBe('cmi.core.score.raw');
    expect(normalizeField('2004', 'cmi.score.raw')).toBe('cmi.score.raw');
    expect(normalizeField('1.2',  'cmi.suspend_data')).toBe('cmi.suspend_data');
  });

  it('returns cmi. key unchanged even with an invalid version', () => {
    expect(normalizeField(null, 'cmi.core.score.raw')).toBe('cmi.core.score.raw');
  });
});

describe('normalizeField — SCORM 1.2', () => {
  it('exception: score -> cmi.core.score.raw', () => {
    expect(normalizeField('1.2', 'score')).toBe('cmi.core.score.raw');
  });

  it('exception: suspend_data -> cmi.suspend_data', () => {
    expect(normalizeField('1.2', 'suspend_data')).toBe('cmi.suspend_data');
  });

  it('default prefix: lesson_status -> cmi.core.lesson_status', () => {
    expect(normalizeField('1.2', 'lesson_status')).toBe('cmi.core.lesson_status');
  });

  it('default prefix: lesson_location -> cmi.core.lesson_location', () => {
    expect(normalizeField('1.2', 'lesson_location')).toBe('cmi.core.lesson_location');
  });

  it('exception: location -> cmi.core.lesson_location', () => {
    expect(normalizeField('1.2', 'location')).toBe('cmi.core.lesson_location');
  });

  it('default prefix: session_time -> cmi.core.session_time', () => {
    expect(normalizeField('1.2', 'session_time')).toBe('cmi.core.session_time');
  });

  it('default prefix: student_name -> cmi.core.student_name', () => {
    expect(normalizeField('1.2', 'student_name')).toBe('cmi.core.student_name');
  });

  it('exception: learner_id -> cmi.core.student_id', () => {
    expect(normalizeField('1.2', 'learner_id')).toBe('cmi.core.student_id');
  });

  it('exception: learner_name -> cmi.core.student_name', () => {
    expect(normalizeField('1.2', 'learner_name')).toBe('cmi.core.student_name');
  });

  it('default prefix: unknown key -> cmi.core.<key>', () => {
    expect(normalizeField('1.2', 'some_unknown_field')).toBe('cmi.core.some_unknown_field');
  });
});

describe('normalizeField — SCORM 2004', () => {
  it('exception: score -> cmi.score.raw', () => {
    expect(normalizeField('2004', 'score')).toBe('cmi.score.raw');
  });

  it('exception: lesson_status -> cmi.completion_status', () => {
    expect(normalizeField('2004', 'lesson_status')).toBe('cmi.completion_status');
  });

  it('exception: lesson_location -> cmi.location', () => {
    expect(normalizeField('2004', 'lesson_location')).toBe('cmi.location');
  });

  it('default prefix: location -> cmi.location', () => {
    expect(normalizeField('2004', 'location')).toBe('cmi.location');
  });

  it('suspend_data -> cmi.suspend_data (default prefix, same as 1.2)', () => {
    expect(normalizeField('2004', 'suspend_data')).toBe('cmi.suspend_data');
  });

  it('default prefix: session_time -> cmi.session_time', () => {
    expect(normalizeField('2004', 'session_time')).toBe('cmi.session_time');
  });

  it('default prefix: learner_name -> cmi.learner_name', () => {
    expect(normalizeField('2004', 'learner_name')).toBe('cmi.learner_name');
  });

  it('exception: student_id -> cmi.learner_id', () => {
    expect(normalizeField('2004', 'student_id')).toBe('cmi.learner_id');
  });

  it('exception: student_name -> cmi.learner_name', () => {
    expect(normalizeField('2004', 'student_name')).toBe('cmi.learner_name');
  });

  it('default prefix: unknown key -> cmi.<key>', () => {
    expect(normalizeField('2004', 'some_unknown_field')).toBe('cmi.some_unknown_field');
  });
});

// ── stringToBoolean ───────────────────────────────────────────────────────── //

describe('stringToBoolean', () => {
  it('"true" -> true', () => expect(stringToBoolean('true')).toBe(true));
  it('"TRUE" -> true', () => expect(stringToBoolean('TRUE')).toBe(true));
  it('"false" -> false', () => expect(stringToBoolean('false')).toBe(false));
  it('"1" -> true', () => expect(stringToBoolean('1')).toBe(true));
  it('"0" -> false', () => expect(stringToBoolean('0')).toBe(false));
  it('true -> true', () => expect(stringToBoolean(true)).toBe(true));
  it('false -> false', () => expect(stringToBoolean(false)).toBe(false));
  it('1 -> true', () => expect(stringToBoolean(1)).toBe(true));
  it('0 -> false', () => expect(stringToBoolean(0)).toBe(false));
  it('undefined -> null', () => expect(stringToBoolean(undefined)).toBe(null));
  it('"abctrue" -> false (substring match must not count)', () => expect(stringToBoolean('abctrue')).toBe(false));
  it('"abc1" -> false (substring match must not count)',    () => expect(stringToBoolean('abc1')).toBe(false));
  it('"true1" -> false',  () => expect(stringToBoolean('true1')).toBe(false));
  it('"1true" -> false',  () => expect(stringToBoolean('1true')).toBe(false));
  it('"" -> false',       () => expect(stringToBoolean('')).toBe(false));
});

// ── formatSessionTime ────────────────────────────────────────────────────── //

describe('formatSessionTime — 1.2 (HH:MM:SS)', () => {
  it('0s -> 00:00:00',   () => expect(formatSessionTime('1.2', 0)).toBe('00:00:00'));
  it('90s -> 00:01:30',  () => expect(formatSessionTime('1.2', 90)).toBe('00:01:30'));
  it('3661s -> 01:01:01',() => expect(formatSessionTime('1.2', 3661)).toBe('01:01:01'));
  it('3600s -> 01:00:00',() => expect(formatSessionTime('1.2', 3600)).toBe('01:00:00'));
});

describe('formatSessionTime — 2004 (PTxHxMxS)', () => {
  it('0s -> PT0H0M0S',   () => expect(formatSessionTime('2004', 0)).toBe('PT0H0M0S'));
  it('90s -> PT0H1M30S', () => expect(formatSessionTime('2004', 90)).toBe('PT0H1M30S'));
  it('3661s -> PT1H1M1S',() => expect(formatSessionTime('2004', 3661)).toBe('PT1H1M1S'));
  it('3600s -> PT1H0M0S',() => expect(formatSessionTime('2004', 3600)).toBe('PT1H0M0S'));
});

describe('formatSessionTime — invalid version', () => {
  it('returns null for an unknown version string', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(formatSessionTime('1.3', 90)).toBeNull();
    spy.mockRestore();
  });

  it('returns null for null version', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(formatSessionTime(null, 90)).toBeNull();
    spy.mockRestore();
  });

  it('logs a console warning with the bad version', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    formatSessionTime('unknown', 60);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('unknown'));
    spy.mockRestore();
  });
});
