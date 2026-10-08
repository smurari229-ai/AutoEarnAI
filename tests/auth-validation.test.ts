// @ts-nocheck -- Bun's test module is resolved by the Bun test runner.
import { describe, expect, test } from "bun:test";
import { isValidOtp, normalizePhone } from "../server/auth-validation";

describe("phone normalization", () => {
  test("normalizes a ten-digit Indian number", () => {
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
  });
  test("normalizes an Indian number with country code", () => {
    expect(normalizePhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizePhone("919876543210")).toBe("+919876543210");
  });
  test("preserves valid non-Indian international numbers", () => {
    expect(normalizePhone("+1 (415) 555-2671")).toBe("+14155552671");
  });
});

describe("OTP validation", () => {
  test("accepts exactly six decimal digits", () => {
    expect(isValidOtp("123456")).toBe(true);
  });
  test("rejects incorrect length and non-digits", () => {
    expect(isValidOtp("12345")).toBe(false);
    expect(isValidOtp("1234567")).toBe(false);
    expect(isValidOtp("12a456")).toBe(false);
    expect(isValidOtp("\\12345")).toBe(false);
    expect(isValidOtp("")).toBe(false);
  });
});
