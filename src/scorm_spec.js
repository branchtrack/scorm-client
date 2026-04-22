// ── SCORM specification constants ─────────────────────────────────────────── //
//
// Centralised reference for allowed field values defined by the SCORM specs,
// organised by version. Add new constrained fields here as further validation
// is introduced.

// ── Allowed field values by version ──────────────────────────────────────── //

/**
 * Per-version map of fully-qualified CMI field → allowed string values.
 *
 * SCORM 1.2:
 *   cmi.core.lesson_status → "passed" | "completed" | "failed" | "incomplete" | "browsed" | "not attempted"
 * SCORM 2004:
 *   cmi.completion_status  → "completed" | "incomplete" | "not attempted" | "unknown"
 *   cmi.success_status     → "passed" | "failed" | "unknown"
 */
export const FIELD_VALUES = {
  '1.2': {
    'cmi.core.lesson_status': ['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'],
  },
  '2004': {
    'cmi.completion_status': ['completed', 'incomplete', 'not attempted', 'unknown'],
    'cmi.success_status':    ['passed', 'failed', 'unknown'],
  },
};
