# scorm-client

A modern, class-based JavaScript client for communicating with SCORM 1.2 and SCORM 2004 Learning Management Systems (LMS).

> Based on the original [scorm-api-wrapper](https://github.com/pipwerks/scorm-api-wrapper) by Philip Hutchison.

## Installation

Install directly from GitHub:

```bash
npm install github:branchtrack/scorm-client
```

Or copy `dist/index.js` directly into your project.

## Quick start

```js
import ScormClient from 'scorm-client';

const client = new ScormClient();

client.init();
const saved = client.resume(); // restore previous session state
client.score({ raw: 85, min: 0, max: 100 });
client.status('completed');
client.suspend({ page: 3 }); // persist state for next session
client.save();
client.quit();
```

## Constructor

```js
const client = new ScormClient(options);
```

| Option                   | Type                      | Default | Description                                                                                                                  |
| ------------------------ | ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `version`                | `'1.2' \| '2004' \| null` | `null`  | SCORM version to use. When `null`, the client auto-detects by looking for `window.API` (1.2) or `window.API_1484_11` (2004). |
| `handleCompletionStatus` | `boolean`                 | `true`  | On `init()`, if the current status is `not attempted` (1.2) or `unknown` (2004), automatically sets it to `incomplete`.      |
| `handleExitMode`         | `boolean`                 | `true`  | On `quit()`, automatically sets the exit CMI field to `suspend` (incomplete) or `logout`/`normal` (completed/passed).        |
| `handleSessionTime`      | `boolean`                 | `true`  | On `quit()`, automatically computes elapsed session time and writes it to the appropriate CMI field before committing.       |
| `debug`                  | `boolean`                 | `false` | Logs trace messages to `console.log`.                                                                                        |

```js
// Auto-detect version (recommended)
const client = new ScormClient();

// Pin to a specific version
const client = new ScormClient({ version: '2004' });

// Debug mode
const client = new ScormClient({ debug: true });

// All options
const client = new ScormClient({
  version: '1.2',
  handleCompletionStatus: true,
  handleExitMode: true,
  handleSessionTime: true,
  debug: false,
});
```

## Properties

| Property          | Type             | Description                                                                   |
| ----------------- | ---------------- | ----------------------------------------------------------------------------- |
| `client.version`  | `string \| null` | Detected or pre-set SCORM version (`'1.2'`, `'2004'`, or `null` before init). |
| `client.isActive` | `boolean`        | Whether the LMS session is currently open.                                    |

```js
client.init();
console.log(client.version); // '1.2' or '2004'
console.log(client.isActive); // true
```

## Methods

### `init()` → `boolean`

Opens a communication session with the LMS. Returns `true` on success.

Must be called before any data operations. Calling `init()` on an already-active connection returns `false` without making an LMS call.

```js
const ok = client.init();
if (!ok) {
  console.error('Could not connect to LMS');
}
```

---

### `quit()` → `boolean`

Closes the LMS session. Returns `true` on success.

When `handleExitMode` is enabled (default), automatically sets the exit field before terminating:

| Completion status       | SCORM 1.2 `cmi.core.exit` | SCORM 2004 `cmi.exit` |
| ----------------------- | ------------------------- | --------------------- |
| `completed` or `passed` | `logout`                  | `normal`              |
| anything else           | `suspend`                 | `suspend`             |

When `handleSessionTime` is enabled (default), automatically computes the time elapsed since `init()` and writes it to the version-appropriate CMI field before the final commit:

| Version    | Field                   | Format                | Example      |
| ---------- | ----------------------- | --------------------- | ------------ |
| SCORM 1.2  | `cmi.core.session_time` | `HH:MM:SS`            | `00:45:12`   |
| SCORM 2004 | `cmi.session_time`      | ISO 8601 (`PTxHxMxS`) | `PT0H45M12S` |

For SCORM 1.2, a `save()` is performed automatically before `LMSFinish`.

```js
client.quit();

// Opt out of automatic session time reporting
const client = new ScormClient({ handleSessionTime: false });
```

---

### `get(parameter)` → `string`

Retrieves a value from the LMS data model. Always returns a string (`"null"` if the connection is inactive).

Parameters are automatically normalized — see [Field name shortcuts](#field-name-shortcuts) below.

```js
// Short keys (version-agnostic)
const status = client.get('lesson_status');
const score = client.get('score');
const name = client.get('student_name');

// Full CMI paths (passed through unchanged)
const status = client.get('cmi.core.lesson_status'); // SCORM 1.2
const status = client.get('cmi.completion_status'); // SCORM 2004
```

---

### `set(parameter, value)` → `boolean`

Writes a value to the LMS data model. Returns `true` on success.

Parameters are automatically normalized — see [Field name shortcuts](#field-name-shortcuts) below.

```js
// Short keys (version-agnostic)
client.set('score', '95');
client.set('lesson_status', 'completed');
client.set('success_status', 'passed'); // 2004 only

// Full CMI paths (passed through unchanged)
client.set('cmi.core.score.raw', '95'); // SCORM 1.2
client.set('cmi.completion_status', 'completed'); // SCORM 2004
```

---

### `save()` → `boolean`

Persists all data to the LMS (calls `LMSCommit` / `Commit`). Returns `true` on success.

Useful to checkpoint progress mid-session. For SCORM 1.2 this is required — `quit()` calls it automatically when `handleExitMode` is enabled.

```js
client.set('cmi.core.score.raw', '72');
client.save(); // persist now, before the user navigates away
```

---

### `status(value?)` → `string | boolean`

Shortcut for reading or writing the version-appropriate completion status field.

Internally maps to `cmi.core.lesson_status` (1.2) or `cmi.completion_status` (2004).

`completion()` is an alias — both methods are identical.

- Called with no argument → returns the current status string
- Called with a string → sets the status, returns `true`/`false`

```js
const current = client.status(); // returns e.g. 'incomplete'
client.status('completed');
client.completion('completed'); // same as above
```

**Valid status values**

| SCORM 1.2       | SCORM 2004      |
| --------------- | --------------- |
| `not attempted` | `not attempted` |
| `incomplete`    | `incomplete`    |
| `completed`     | `completed`     |
| `passed`        | —               |
| `failed`        | —               |
| `browsed`       | —               |
| —               | `unknown`       |

---

### `score(value?)` → `string | boolean`

Shortcut for reading or writing score fields. Abstracts the version difference between `cmi.core.score.*` (1.2) and `cmi.score.*` (2004).

- Called with no argument → returns the raw score string
- Called with a number → sets `score.raw`, returns `true`/`false`
- Called with an object → sets each present key (`raw`, `min`, `max`, `scaled`); `scaled` is silently ignored on SCORM 1.2

```js
const raw = client.score(); // get raw score
client.score(85); // set raw score
client.score({ raw: 85, min: 0, max: 100 }); // set multiple fields
client.score({ raw: 85, min: 0, max: 100, scaled: 0.85 }); // 2004: also sets scaled
```

---

### `suspend(data)` → `boolean`

Serializes data and writes it to `cmi.suspend_data`. Strings are stored as-is; any other value is `JSON.stringify`'d first.

```js
client.suspend({ page: 3, answers: [1, 0, 2] }); // stored as JSON string
client.suspend('raw string'); // stored as-is
```

---

### `resume()` → `any | null`

Reads `cmi.suspend_data` and attempts to parse it as JSON.

- Returns `null` if the field is empty
- Returns the parsed value if the content is valid JSON
- Returns the raw string if JSON parsing fails

```js
client.suspend({ page: 3 });
// ... later session ...
const state = client.resume(); // → { page: 3 }
```

---

### `location(value?)` → `string | boolean`

Shortcut for reading or writing the learner's bookmark position.

Maps to `cmi.core.lesson_location` (1.2) or `cmi.location` (2004).

- Called with no argument → returns the current location string
- Called with a string → sets the location, returns `true`/`false`

```js
const bookmark = client.location(); // get current position
client.location('slide-12'); // save position
```

---

### `success(value?)` → `string | boolean`

Shortcut for reading or writing the version-appropriate success status field.

Maps to `cmi.core.success_status` (1.2) or `cmi.success_status` (2004).

- Called with no argument → returns the current value string (`'passed'`, `'failed'`, or `'unknown'`)
- Called with `true` → sets `'passed'`
- Called with `false` → sets `'failed'`
- Called with a string → sets the value directly

```js
client.success(true);        // sets 'passed'
client.success(false);       // sets 'failed'
client.success('unknown');   // sets directly
const result = client.success(); // → 'passed' / 'failed' / 'unknown'
```

---

### `getLastError()` → `number`

Returns the last LMS error code as an integer. Returns `0` if there is no error or the API is unavailable.

```js
const code = client.getLastError();
if (code !== 0) {
  console.error('LMS error code:', code);
}
```

---

### `getErrorInfo(errorCode)` → `string`

Returns the human-readable description for a given error code.

```js
const code = client.getLastError();
const info = client.getErrorInfo(code);
console.error(info); // e.g. 'Invalid argument error'
```

---

### `getDiagnosticInfo(errorCode)` → `string`

Returns LMS-specific diagnostic details for a given error code. Content is LMS-defined.

```js
const code = client.getLastError();
console.debug(client.getDiagnosticInfo(code));
```

---

### `isAvailable()` → `true`

Always returns `true`. Allows external runtimes to confirm the wrapper is loaded.

---

## Typical session lifecycle

```js
import ScormClient from 'scorm-client';

const client = new ScormClient();

// 1. Open session
if (!client.init()) {
  throw new Error('LMS connection failed');
}

// 2. Read learner data
const studentName = client.get('student_name'); // cmi.core.student_name (1.2) / cmi.learner_name (2004)
// or equivalently:
const learnerName = client.get('learner_name'); // same result, both forms accepted

// 3. Restore saved state
const saved = client.resume(); // null on first launch, object on return

// 4. Update progress
client.set('score', '88'); // resolves per version

// 5. Mark complete
client.status('completed');

// 6. Save bookmark and close
client.location('slide-12');
client.suspend({ page: 5, completed: true });
client.save();
client.quit();
```

## Field name shortcuts

`get()` and `set()` accept short field names that are resolved to the correct CMI path for the active SCORM version. Pass a full `cmi.*` path to bypass normalization entirely.

**Resolution rules (applied in order):**

1. Key starts with `cmi.` → passed through unchanged
2. Key matches an exception entry → use the mapped path
3. Otherwise → prepend the default prefix (`cmi.core.` for 1.2, `cmi.` for 2004)

**Exception mappings (keys that deviate from the default prefix):**

| Short key         | SCORM 1.2                  | SCORM 2004              |
| ----------------- | -------------------------- | ----------------------- |
| `score`           | `cmi.core.score.raw`       | `cmi.score.raw`         |
| `lesson_status`   | `cmi.core.lesson_status`   | `cmi.completion_status` |
| `lesson_location` | `cmi.core.lesson_location` | `cmi.location`          |
| `location`        | `cmi.core.lesson_location` | `cmi.location`          |
| `suspend_data`    | `cmi.suspend_data`         | `cmi.suspend_data`      |

**Cross-version learner identity aliases:**

SCORM 1.2 uses `student_*` field names; SCORM 2004 uses `learner_*`. Both short forms are accepted in either version and resolve to the correct underlying field.

| Short key      | SCORM 1.2               | SCORM 2004         |
| -------------- | ----------------------- | ------------------ |
| `learner_id`   | `cmi.core.student_id`   | `cmi.learner_id`   |
| `learner_name` | `cmi.core.student_name` | `cmi.learner_name` |
| `student_id`   | `cmi.core.student_id`   | `cmi.learner_id`   |
| `student_name` | `cmi.core.student_name` | `cmi.learner_name` |

**Default prefix examples (no exception needed):**

```js
client.get('success_status'); // → cmi.core.success_status (1.2) / cmi.success_status (2004)
client.get('completion_threshold'); // → cmi.core.completion_threshold (1.2) / cmi.completion_threshold (2004)
client.set('exit', 'suspend'); // → cmi.core.exit (1.2) / cmi.exit (2004)
```

---

## SCORM 1.2 vs SCORM 2004 field reference

| Concept           | SCORM 1.2                                    | SCORM 2004              |
| ----------------- | -------------------------------------------- | ----------------------- |
| Completion status | `cmi.core.lesson_status`                     | `cmi.completion_status` |
| Success status    | `cmi.core.lesson_status` (`passed`/`failed`) | `cmi.success_status`    |
| Score (raw)       | `cmi.core.score.raw`                         | `cmi.score.raw`         |
| Score (min)       | `cmi.core.score.min`                         | `cmi.score.min`         |
| Score (max)       | `cmi.core.score.max`                         | `cmi.score.max`         |
| Session time      | `cmi.core.session_time`                      | `cmi.session_time`      |
| Learner name      | `cmi.core.student_name`                      | `cmi.learner_name`      |
| Learner ID        | `cmi.core.student_id`                        | `cmi.learner_id`        |
| Exit              | `cmi.core.exit`                              | `cmi.exit`              |
| Suspend data      | `cmi.suspend_data`                           | `cmi.suspend_data`      |

## Browser support

Compiled with Babel targeting:

- Last 2 Chrome versions
- Last 2 Edge versions
- Last 2 Firefox versions + Firefox ESR
- Last 2 Safari versions
- Last 2 iOS Safari versions

## Development

```bash
npm install       # install dependencies
npm run build     # compile + minify → dist/index.js
npm test          # run tests (Vitest)
npm run test:watch  # watch mode
```

## License

MIT
