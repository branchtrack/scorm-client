# Development Plan

## Completed

### ✅ #1 — Session time tracking

- Automatic `cmi.core.session_time` / `cmi.session_time` on `quit()`
- `handleSessionTime` constructor option

### ✅ #1.5 — `normalizeField()`

- Short key resolution (`lesson_status`, `score`, `location`, etc.) in `get()` / `set()`
- Cross-version learner identity aliases (`learner_name` ↔ `student_name` etc.)
- Exported via `scorm-client/utils`

### ✅ #2 — `score()`

- Get/set raw score
- Object form for `raw`, `min`, `max`, `scaled`

### ✅ #3 — `suspend()` / `resume()`

- JSON-aware suspend data helpers

### ✅ #4 — `location()`

- Bookmark shortcut
- `location` alias for 1.2 in `normalizeField`

### ✅ #5 — `success()`

- Success status shortcut; `true`/`false` map to `'passed'`/`'failed'`
- `completion()` alias for `status()`

### ✅ Build

- Migrated from Babel+Terser to Vite + Oxc
- `browserslist-to-esbuild` for `.browserslistrc` support
- `scorm-client/utils` subpath export

### ✅ Release

- `release-it` configured for npm publish
- `prepublishOnly` lifecycle
- `files` field in `package.json`

---

## Remaining

### #6 — Offline / standalone mode

- `standalone: true` constructor option
- All LMS calls silently no-op when no API is found
- `init()` returns `true`, no errors
- Great for running content outside an LMS during development

### #7 — Auto-save interval

- `startAutoSave(intervalMs)` — periodic `save()` calls
- `stopAutoSave()` — clears the interval
- Should be safe to call when not connected (no-op)

### #8 — Event callbacks / hooks

- Constructor options: `onInit`, `onQuit`, `onError`
- `onError(code, info)` — fires whenever a get/set/save fails
- Useful for error reporting integrations (e.g. Sentry)

### #9 — Batch `getAll()` / `setAll()`

- `setAll({ 'cmi.score.raw': 85, lesson_status: 'completed' })` — set multiple fields at once, short keys supported
- `getAll(['learner_name', 'score'])` — returns object with resolved values
- Small, high-value convenience

### #10 — Learner info helpers

- `getLearnerId()` — wraps `get('learner_id')`
- `getLearnerName()` — wraps `get('learner_name')`
- Partially covered by `normalizeField` aliases; wrapper methods still missing

### #11 — Interactions API _(most complex)_

- Typed helpers for `cmi.interactions.n.*` (both versions)
- Add interaction, get interaction count, get by index
- Needs separate planning discussion before implementation
