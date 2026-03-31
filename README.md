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
client.set('cmi.core.score.raw', '85'); // SCORM 1.2
client.status('set', 'completed');
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

For SCORM 1.2, a `save()` is performed automatically before `LMSFinish`.

```js
client.quit();
```

---

### `get(parameter)` → `string`

Retrieves a value from the LMS data model. Always returns a string (`"null"` if the connection is inactive).

```js
// SCORM 1.2
const status = client.get('cmi.core.lesson_status');
const score = client.get('cmi.core.score.raw');
const name = client.get('cmi.core.student_name');

// SCORM 2004
const status = client.get('cmi.completion_status');
const score = client.get('cmi.score.raw');
```

---

### `set(parameter, value)` → `boolean`

Writes a value to the LMS data model. Returns `true` on success.

```js
// SCORM 1.2
client.set('cmi.core.score.raw', '95');
client.set('cmi.core.lesson_status', 'completed');

// SCORM 2004
client.set('cmi.score.raw', '95');
client.set('cmi.completion_status', 'completed');
client.set('cmi.success_status', 'passed');
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

### `status(action, value?)` → `string | boolean`

Shortcut for reading or writing the version-appropriate completion status field.

Internally maps to `cmi.core.lesson_status` (1.2) or `cmi.completion_status` (2004).

```js
const current = client.status('get'); // returns e.g. 'incomplete'
client.status('set', 'completed'); // returns true/false
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
import ScormClient from './scorm-client.js';

const client = new ScormClient();

// 1. Open session
if (!client.init()) {
  throw new Error('LMS connection failed');
}

// 2. Read learner data
const studentName = client.get(
  client.version === '1.2' ? 'cmi.core.student_name' : 'cmi.learner_name',
);

// 3. Update progress
client.set(
  client.version === '1.2' ? 'cmi.core.score.raw' : 'cmi.score.raw',
  '88',
);

// 4. Mark complete
client.status('set', 'completed');

// 5. Persist and close
client.save();
client.quit();
```

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
