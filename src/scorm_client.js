import { normalizeField, stringToBoolean, formatSessionTime } from './utils.js';

/*
  ScormClient — modern class-based SCORM 1.2 / 2004 API wrapper
  Replaces the pipwerks singleton with a proper instantiable client.

  Usage:
    import ScormClient from 'scorm-client';

    const client = new ScormClient();
    // or pre-set the version and options:
    const client = new ScormClient({ version: '1.2', debug: true });

    client.init();
    client.set('cmi.core.score.raw', '95');
    client.quit();
*/

export class ScormClient {
  // Private state
  #version;
  #handleCompletionStatus;
  #handleExitMode;
  #handleSessionTime;
  #debugActive;
  #apiHandle;
  #apiFound;
  #connectionActive;
  #completionStatus;
  #exitStatus;
  #sessionStartTime;

  /**
   * @param {object}      [options]
   * @param {string|null} [options.version]                - Pre-set SCORM version ('1.2' or '2004'). Auto-detected when null.
   * @param {boolean}     [options.handleCompletionStatus] - Automatically set 'incomplete' on first launch (default: true).
   * @param {boolean}     [options.handleExitMode]         - Automatically set exit mode on terminate (default: true).
   * @param {boolean}     [options.handleSessionTime]      - Automatically write session time on quit (default: true).
   * @param {boolean}     [options.debug]                  - Enable console trace logging (default: false).
   */
  constructor({ version = null, handleCompletionStatus = true, handleExitMode = true, handleSessionTime = true, debug = false } = {}) {
    this.#version = version;
    this.#handleCompletionStatus = handleCompletionStatus;
    this.#handleExitMode = handleExitMode;
    this.#handleSessionTime = handleSessionTime;
    this.#debugActive = debug;
    this.#apiHandle = null;
    this.#apiFound = false;
    this.#connectionActive = false;
    this.#completionStatus = null;
    this.#exitStatus = null;
    this.#sessionStartTime = null;
  }

  // ── Public read-only accessors ──────────────────────────────────────────── //

  get version() { return this.#version; }
  get isActive() { return this.#connectionActive; }

  /** Allows Flash / other runtimes to confirm the wrapper is present. */
  isAvailable() { return true; }

  // ── Connection ───────────────────────────────────────────────────────────── //

  /** Initialize the LMS session. Returns true on success. */
  init() {
    if (this.#connectionActive) {
      this.#trace('connection.initialize aborted: Connection already active.');
      return false;
    }

    const api = this.#getApiHandle();
    if (!api) {
      this.#trace('connection.initialize failed: API is null.');
      return false;
    }

    let success =
      this.#version === '1.2'
        ? stringToBoolean(api.LMSInitialize(''))
        : stringToBoolean(api.Initialize(''));

    if (success) {
      const errorCode = this.getLastError();
      if (errorCode === 0) {
        this.#connectionActive = true;
        this.#sessionStartTime = Date.now();

        if (this.#handleCompletionStatus) {
          const currentStatus = this.status();
          if (currentStatus === 'not attempted' || currentStatus === 'unknown') {
            this.status('incomplete');
            this.save();
          }
        }
      } else {
        success = false;
        this.#trace(`connection.initialize failed. Error code: ${errorCode} | Info: ${this.getErrorInfo(errorCode)}`);
      }
    } else {
      const errorCode = this.getLastError();
      this.#trace(
        errorCode && errorCode !== 0
          ? `connection.initialize failed. Error code: ${errorCode} | Info: ${this.getErrorInfo(errorCode)}`
          : 'connection.initialize failed: No response from server.'
      );
    }

    return success;
  }

  /** Terminate the LMS session. Returns true on success. */
  quit() {
    if (!this.#connectionActive) {
      this.#trace('connection.terminate aborted: Connection already terminated.');
      return false;
    }

    const api = this.#getApiHandle();
    if (!api) {
      this.#trace('connection.terminate failed: API is null.');
      return false;
    }

    if (this.#handleExitMode && !this.#exitStatus) {
      const finished = this.#completionStatus === 'completed' || this.#completionStatus === 'passed';
      this.set('exit', finished ? (this.#version === '1.2' ? 'logout' : 'normal') : 'suspend');
    }

    // Write session time before committing.
    if (this.#handleSessionTime && this.#sessionStartTime) {
      const elapsedSeconds = Math.round((Date.now() - this.#sessionStartTime) / 1000);
      this.set('session_time', formatSessionTime(this.#version, elapsedSeconds));
    }

    // SCORM 1.2 requires an explicit commit before LMSFinish; 2004 commits implicitly on Terminate.
    const saved = this.#version === '1.2' ? this.save() : true;
    if (!saved) return false;

    const success =
      this.#version === '1.2'
        ? stringToBoolean(api.LMSFinish(''))
        : stringToBoolean(api.Terminate(''));

    if (success) {
      this.#connectionActive = false;
      this.#sessionStartTime = null;
    } else {
      const errorCode = this.getLastError();
      this.#trace(`connection.terminate failed. Error code: ${errorCode} | Info: ${this.getErrorInfo(errorCode)}`);
    }

    return success;
  }

  // ── Data ─────────────────────────────────────────────────────────────────── //

  /** Get a SCORM data model value. Returns a string. */
  get(parameter) {
    parameter = normalizeField(this.#version, parameter);

    if (!this.#connectionActive) {
      this.#trace(`data.get('${parameter}') failed: API connection is inactive.`);
      return String(null);
    }

    const api = this.#getApiHandle();
    if (!api) {
      this.#trace(`data.get('${parameter}') failed: API is null.`);
      return String(null);
    }

    const value =
      this.#version === '1.2'
        ? api.LMSGetValue(parameter)
        : api.GetValue(parameter);

    const errorCode = this.getLastError();
    if (value !== '' || errorCode === 0) {
      if (parameter === 'cmi.core.lesson_status' || parameter === 'cmi.completion_status') {
        this.#completionStatus = value;
      }
      if (parameter === 'cmi.core.exit' || parameter === 'cmi.exit') {
        this.#exitStatus = value;
      }
    } else {
      this.#trace(`data.get('${parameter}') failed. Error code: ${errorCode} | Info: ${this.getErrorInfo(errorCode)}`);
    }

    return String(value);
  }

  /** Set a SCORM data model value. Returns true on success. */
  set(parameter, value) {
    parameter = normalizeField(this.#version, parameter);

    if (!this.#connectionActive) {
      this.#trace(`data.set('${parameter}') failed: API connection is inactive.`);
      return false;
    }

    const api = this.#getApiHandle();
    if (!api) {
      this.#trace(`data.set('${parameter}') failed: API is null.`);
      return false;
    }

    const success =
      this.#version === '1.2'
        ? stringToBoolean(api.LMSSetValue(parameter, value))
        : stringToBoolean(api.SetValue(parameter, value));

    if (success) {
      if (parameter === 'cmi.core.lesson_status' || parameter === 'cmi.completion_status') {
        this.#completionStatus = value;
      }
    } else {
      const errorCode = this.getLastError();
      this.#trace(`data.set('${parameter}') failed. Error code: ${errorCode} | Info: ${this.getErrorInfo(errorCode)}`);
    }

    return success;
  }

  /** Persist all data to the LMS. Returns true on success. */
  save() {
    if (!this.#connectionActive) {
      this.#trace('data.save failed: API connection is inactive.');
      return false;
    }

    const api = this.#getApiHandle();
    if (!api) {
      this.#trace('data.save failed: API is null.');
      return false;
    }

    return this.#version === '1.2'
      ? stringToBoolean(api.LMSCommit(''))
      : stringToBoolean(api.Commit(''));
  }

  // ── Status shortcut ──────────────────────────────────────────────────────── //

  /**
   * Get or set the SCORM completion status.
   * @param {'get'|'set'} action
   * @param {string} [value] - Required when action is 'set'.
   */
  status(value) {
    if (value === undefined) return this.get('lesson_status');

    if (!value) {
      this.#trace('status failed: status value was not specified.');
      return false;
    }

    return this.set('lesson_status', value);
  }

  // ── Location shortcut ────────────────────────────────────────────────────── //

  /**
   * Get or set the learner's bookmark location.
   * Maps to cmi.core.lesson_location (1.2) or cmi.location (2004).
   * @param {string} [value]
   * @returns {string|boolean}
   */
  location(value) {
    if (value === undefined) return this.get('location');
    return this.set('location', value);
  }

  // ── Score shortcut ──────────────────────────────────────────────────────── //

  /**
   * Get or set SCORM score fields.
   *
   * @overload
   * @returns {string} Raw score value.
   *
   * @overload
   * @param {number} value - Sets score.raw.
   * @returns {boolean}
   *
   * @overload
   * @param {{ raw?: number, min?: number, max?: number, scaled?: number }} value
   *   Sets each present key. `scaled` is silently ignored on SCORM 1.2.
   * @returns {boolean}
   */
  score(value) {
    if (value === undefined) {
      return this.get('score');
    }

    if (typeof value === 'number') {
      return this.set('score', String(value));
    }

    if (typeof value === 'object' && value !== null) {
      let success = true;
      if (value.raw !== undefined) success = this.set('score.raw', String(value.raw)) && success;
      if (value.min !== undefined) success = this.set('score.min', String(value.min)) && success;
      if (value.max !== undefined) success = this.set('score.max', String(value.max)) && success;
      if (value.scaled !== undefined && this.#version === '2004') {
        success = this.set('score.scaled', String(value.scaled)) && success;
      }
      return success;
    }

    this.#trace('score failed: invalid value type.');
    return false;
  }

  // ── Suspend data helpers ─────────────────────────────────────────────────── //

  /**
   * Serialize and store data in cmi.suspend_data.
   * @param {string|object} data - String stored as-is; anything else is JSON.stringify'd.
   * @returns {boolean}
   */
  suspend(data) {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    return this.set('suspend_data', raw);
  }

  /**
   * Retrieve and deserialize cmi.suspend_data.
   * @returns {any|null} Parsed JSON if possible, raw string if not, null if empty.
   */
  resume() {
    const raw = this.get('suspend_data');
    if (!raw || raw === 'null') return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  // ── Debug ────────────────────────────────────────────────────────────────── //

  /** Returns the last LMS error code as an integer. */
  getLastError() {
    const api = this.#getApiHandle();
    if (!api) {
      this.#trace('getLastError failed: API is null.');
      return 0;
    }

    return this.#version === '1.2'
      ? parseInt(api.LMSGetLastError(), 10)
      : parseInt(api.GetLastError(), 10);
  }

  /** Returns the error string for a given error code. */
  getErrorInfo(errorCode) {
    const api = this.#getApiHandle();
    if (!api) {
      this.#trace('getErrorInfo failed: API is null.');
      return '';
    }

    return String(
      this.#version === '1.2'
        ? api.LMSGetErrorString(String(errorCode))
        : api.GetErrorString(String(errorCode))
    );
  }

  /** Returns LMS-specific diagnostic info for a given error code. */
  getDiagnosticInfo(errorCode) {
    const api = this.#getApiHandle();
    if (!api) {
      this.#trace('getDiagnosticInfo failed: API is null.');
      return '';
    }

    return String(
      this.#version === '1.2'
        ? api.LMSGetDiagnostic(errorCode)
        : api.GetDiagnostic(errorCode)
    );
  }

  // ── Private: API discovery ───────────────────────────────────────────────── //

  #findApi(win) {
    let attempts = 0;
    const limit = 500;

    while (
      !win.API && !win.API_1484_11 &&
      win.parent && win.parent !== win &&
      attempts <= limit
    ) {
      attempts++;
      win = win.parent;
    }

    if (this.#version) {
      if (this.#version === '2004') return win.API_1484_11 ?? null;
      if (this.#version === '1.2')  return win.API ?? null;
      return null;
    }

    if (win.API_1484_11) { this.#version = '2004'; return win.API_1484_11; }
    if (win.API)         { this.#version = '1.2';  return win.API; }

    this.#trace(`API.find: no API found after ${attempts} attempts.`);
    return null;
  }

  #getApi() {
    let api = this.#findApi(window);

    if (!api && window.parent && window.parent !== window) {
      api = this.#findApi(window.parent);
    }
    if (!api && window.top?.opener) {
      api = this.#findApi(window.top.opener);
    }
    if (!api && window.top?.opener?.document) {
      api = this.#findApi(window.top.opener.document);
    }

    if (api) {
      this.#apiFound = true;
    } else {
      this.#trace("API.get: Can't find the API!");
    }

    return api;
  }

  #getApiHandle() {
    if (!this.#apiHandle && !this.#apiFound) {
      this.#apiHandle = this.#getApi();
    }
    return this.#apiHandle;
  }



  #trace(msg) {
    if (this.#debugActive && window.console?.log) {
      window.console.log(msg);
    }
  }
}

export default ScormClient;
