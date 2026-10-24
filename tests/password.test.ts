import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("uses a salted scrypt hash and verifies the original password", async () => {
    const password = "A-long-test-password!2026";
    const hash = await hashPassword(password);

    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces a different hash for the same password", async () => {
    const password = "Another-long-password!2026";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword(password, second)).toBe(true);
  });

  it("rejects malformed or unsupported hashes without throwing", async () => {
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "plaintext")).toBe(false);
    expect(await verifyPassword("anything", "bcrypt$10$abc")).toBe(false);
    expect(await verifyPassword("anything", "scrypt$999999$8$1$abc$def")).toBe(false);
  });
});
