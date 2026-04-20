// ── Field normalisation ───────────────────────────────────────────────────── //

/**
 * Resolve a short field name (e.g. 'score', 'lesson_status') to its full
 * CMI path for the given SCORM version.
 *
 * Rules:
 *  - If key already starts with 'cmi.' it is returned unchanged.
 *  - A small exceptions map covers fields that deviate from the default prefix.
 *  - Everything else gets the default prefix: 'cmi.core.' for 1.2, 'cmi.' for 2004.
 *
 * @param {string} version - '1.2' or '2004'
 * @param {string} key
 * @returns {string}
 */
export function normalizeField(version, key) {
  if (key.startsWith('cmi.')) return key;

  const exceptions = {
    '1.2': {
      suspend_data:    'cmi.suspend_data',
      score:           'cmi.core.score.raw',
      location:        'cmi.core.lesson_location',
      learner_id:      'cmi.core.student_id',
      learner_name:    'cmi.core.student_name',
    },
    '2004': {
      score:           'cmi.score.raw',
      lesson_status:   'cmi.completion_status',
      lesson_location: 'cmi.location',
      student_id:      'cmi.learner_id',
      student_name:    'cmi.learner_name',
    },
  };

  const map = exceptions[version] ?? {};
  if (key in map) return map[key];

  const prefix = version === '1.2' ? 'cmi.core.' : 'cmi.';
  return prefix + key;
}

// ── Type coercion ─────────────────────────────────────────────────────────── //

/**
 * Convert various LMS response types to a boolean.
 *
 * @param {*} value
 * @returns {boolean|null}
 */
export function stringToBoolean(value) {
  switch (typeof value) {
    case 'object':
    case 'string':  return /^(true|1)$/i.test(value);
    case 'number':  return !!value;
    case 'boolean': return value;
    case 'undefined': return null;
    default: return false;
  }
}

// ── Session time formatting ───────────────────────────────────────────────── //

/**
 * Format elapsed seconds as a SCORM session time string.
 *
 * - SCORM 1.2  → HH:MM:SS  (CMITimespan; spec caps at 9999:59:59.99)
 * - SCORM 2004 → PTxHxMxS  (ISO 8601 duration)
 *
 * Non-finite, negative, or missing input is clamped to 0 so the wrapper
 * never writes garbage like `PTNaNHNaNMNaNS` to the LMS (e.g. if the
 * session start time was lost across a page reload).
 *
 * @param {string} version - '1.2' or '2004'
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatSessionTime(version, totalSeconds) {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0
    ? Math.floor(totalSeconds)
    : 0;

  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;

  if (version === '1.2') {
    // SCORM 1.2 CMITimespan caps at 9999:59:59.
    const hh = Math.min(h, 9999);
    return [hh, m, s].map(v => String(v).padStart(2, '0')).join(':');
  }
  return `PT${h}H${m}M${s}S`;
}
