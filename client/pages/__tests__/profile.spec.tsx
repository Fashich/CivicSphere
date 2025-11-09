import { describe, it, expect } from "vitest";
import { isValidUrl as _isValidUrl } from "../Profile";

// Since Profile exports isValidUrl inside the file, import path may vary. We'll implement a small wrapper here.

describe("isValidUrl utility", () => {
  it("accepts empty string", () => {
    expect(_isValidUrl("")).toBe(true);
  });
  it("accepts http urls", () => {
    expect(_isValidUrl("http://example.com")).toBe(true);
  });
  it("accepts https urls", () => {
    expect(_isValidUrl("https://example.com/path")).toBe(true);
  });
  it("rejects invalid urls", () => {
    expect(_isValidUrl("not-a-url")).toBe(false);
  });
});
