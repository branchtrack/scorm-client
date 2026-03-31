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
  #debugActive;
  #apiHandle;
  #apiFound;
  #connectionActive;
  #completionStatus;
  #exitStatus;

  /**
   * @param {object}      [options]
   * @param {string|null} [options.version]                - Pre-set SCORM version ('1.2' or '2004'). Auto-detected when null.
   * @param {boolean}     [options.handleCompletionStatus] - Automatically set 'incomplete' on first launch (default: true).
   * @param {boolean}     [options.handleExitMode]         - Automatically set exit mode on terminate (default: true).
   * @param {boolean}     [options.debug]                  - Enable console trace logging (default: false).
   */
  constructor({ version = null, handleCompletionStatus = true, handleExitMode = true, debug = false } = {}) {
    this.#version = version;
    this.#handleCompletionStatus = handleCompletionStatus;
    this.#handleExitMode = handleExitMode;
    this.#debugActive = debug;
    this.#apiHandle = null;
    this.#apiFound = false;
    this.#connectionActive = false;
    this.#completionStatus = null;
    this.#exitStatus = null;
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
        ? this.#stringToBoolean(api.LMSInitialize(''))
        : this.#stringToBoolean(api.Initialize(''));

    if (success) {
      const errorCode = this.getLastError();
      if (errorCode === 0) {
        this.#connectionActive = true;

        if (this.#handleCompletionStatus) {
          const currentStatus = this.status('get');
          if (currentStatus === 'not attempted' || currentStatus === 'unknown') {
            this.status('set', 'incomplete');
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
      if (this.#version === '1.2') {
        this.set('cmi.core.exit', finished ? 'logout' : 'suspend');
      } else {
        this.set('cmi.exit', finished ? 'normal' : 'suspend');
      }
    }

    // SCORM 1.2 requires an explicit commit before LMSFinish; 2004 commits implicitly on Terminate.
    const saved = this.#version === '1.2' ? this.save() : true;
    if (!saved) return false;

    const success =
      this.#version === '1.2'
        ? this.#stringToBoolean(api.LMSFinish(''))
        : this.#stringToBoolean(api.Terminate(''));

    if (success) {
      this.#connectionActive = false;
    } else {
      const errorCode = this.getLastError();
      this.#trace(`connection.terminate failed. Error code: ${errorCode} | Info: ${this.getErrorInfo(errorCode)}`);
    }

    return success;
  }

  // ── Data ─────────────────────────────────────────────────────────────────── //

  /** Get a SCORM data model value. Returns a string. */
  get(parameter) {
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
        ? this.#stringToBoolean(api.LMSSetValue(parameter, value))
        : this.#stringToBoolean(api.SetValue(parameter, value));

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
      ? this.#stringToBoolean(api.LMSCommit(''))
      : this.#stringToBoolean(api.Commit(''));
  }

  // ── Status shortcut ──────────────────────────────────────────────────────── //

  /**
   * Get or set the SCORM completion status.
   * @param {'get'|'set'} action
   * @param {string} [value] - Required when action is 'set'.
   */
  status(action, value = null) {
    if (!action) {
      this.#trace('status failed: action was not specified.');
      return false;
    }

    const cmi =
      this.#version === '1.2' ? 'cmi.core.lesson_status' : 'cmi.completion_status';

    if (action === 'get') return this.get(cmi);

    if (action === 'set') {
      if (!value) {
        this.#trace('status failed: status value was not specified.');
        return false;
      }
      return this.set(cmi, value);
    }

    this.#trace('status failed: no valid action was specified.');
    return false;
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

  // ── Private: utilities ───────────────────────────────────────────────────── //

  #stringToBoolean(value) {
    switch (typeof value) {
      case 'object':
      case 'string':  return /(true|1)/i.test(value);
      case 'number':  return !!value;
      case 'boolean': return value;
      case 'undefined': return null;
      default: return false;
    }
  }

  #trace(msg) {
    if (this.#debugActive && window.console?.log) {
      window.console.log(msg);
    }
  }
}

export default ScormClient;
