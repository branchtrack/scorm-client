import { describe, it, expect } from 'vitest';
import { normalizeField, stringToBoolean, formatSessionTime } from '../../src/utils.js';

// ── normalizeField ────────────────────────────────────────────────────────── //

describe('normalizeField — pass-through', () => {
  it('returns key unchanged when it starts with cmi.', () => {
    expect(normalizeField('1.2',  'cmi.core.score.raw')).toBe('cmi.core.score.raw');
    expect(normalizeField('2004', 'cmi.score.raw')).toBe('cmi.score.raw');
    expect(normalizeField('1.2',  'cmi.suspend_data')).toBe('cmi.suspend_data');
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
  it('"false" -> false', () => expect(stringToBoolean('false')).toBe(false));
  it('"1" -> true', () => expect(stringToBoolean('1')).toBe(true));
  it('"0" -> false', () => expect(stringToBoolean('0')).toBe(false));
  it('true -> true', () => expect(stringToBoolean(true)).toBe(true));
  it('false -> false', () => expect(stringToBoolean(false)).toBe(false));
  it('1 -> true', () => expect(stringToBoolean(1)).toBe(true));
  it('0 -> false', () => expect(stringToBoolean(0)).toBe(false));
  it('undefined -> null', () => expect(stringToBoolean(undefined)).toBe(null));
  it('"" -> false', () => expect(stringToBoolean('')).toBe(false));
  it('"truthy" -> false (anchored — substring match is not enough)', () => {
    expect(stringToBoolean('truthy')).toBe(false);
    expect(stringToBoolean('a1b')).toBe(false);
  });
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

describe('formatSessionTime — invalid input', () => {
  it('NaN clamps to 0 (1.2)',       () => expect(formatSessionTime('1.2', NaN)).toBe('00:00:00'));
  it('NaN clamps to 0 (2004)',      () => expect(formatSessionTime('2004', NaN)).toBe('PT0H0M0S'));
  it('undefined clamps to 0 (1.2)', () => expect(formatSessionTime('1.2', undefined)).toBe('00:00:00'));
  it('negative clamps to 0 (2004)', () => expect(formatSessionTime('2004', -42)).toBe('PT0H0M0S'));
  it('Infinity clamps to 0 (2004)', () => expect(formatSessionTime('2004', Infinity)).toBe('PT0H0M0S'));
  it('caps at 9999h for 1.2',       () => expect(formatSessionTime('1.2', 10_000 * 3600)).toBe('9999:00:00'));
});
