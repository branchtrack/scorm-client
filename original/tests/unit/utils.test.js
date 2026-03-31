import { describe, it, expect } from 'vitest';
import pipwerks from '../../src/scorm_api_wrapper.js';

const { StringToBoolean } = pipwerks.UTILS;

describe('UTILS.StringToBoolean', () => {
  it('converts "true" string to true', () => {
    expect(StringToBoolean('true')).toBe(true);
  });

  it('converts "false" string to false', () => {
    expect(StringToBoolean('false')).toBe(false);
  });

  it('converts "1" string to true', () => {
    expect(StringToBoolean('1')).toBe(true);
  });

  it('converts "0" string to false', () => {
    expect(StringToBoolean('0')).toBe(false);
  });

  it('converts String object "true" to true', () => {
    expect(StringToBoolean(new String('true'))).toBe(true);
  });

  it('converts String object "false" to false', () => {
    expect(StringToBoolean(new String('false'))).toBe(false);
  });

  it('converts number 1 to true', () => {
    expect(StringToBoolean(1)).toBe(true);
  });

  it('converts number 0 to false', () => {
    expect(StringToBoolean(0)).toBe(false);
  });

  it('passes boolean true through', () => {
    expect(StringToBoolean(true)).toBe(true);
  });

  it('passes boolean false through', () => {
    expect(StringToBoolean(false)).toBe(false);
  });

  it('returns null for undefined', () => {
    expect(StringToBoolean(undefined)).toBeNull();
  });

  it('returns false for null (typeof object, no "true"/"1" match)', () => {
    expect(StringToBoolean(null)).toBe(false);
  });
});
