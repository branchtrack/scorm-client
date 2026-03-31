import { beforeEach } from 'vitest';
import pipwerks from '../original/src/scorm_api_wrapper.js';

beforeEach(() => {
  pipwerks.debug.isActive = false;
});
