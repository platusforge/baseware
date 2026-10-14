import { signAccessToken, signRefreshToken, verifyToken } from "@/lib/jwt";

describe("JWT token type enforcement", () => {
  it("should reject a refresh token replayed as an access token", () => {
    const refresh = signRefreshToken("u1", "refresh-jti");
    expect(() => verifyToken(refresh, "access")).toThrow("Invalid token type.");
  });

  it("should reject an access token used as a refresh token", () => {
    const access = signAccessToken("u1", "access-jti");
    expect(() => verifyToken(access, "refresh")).toThrow("Invalid token type.");
  });

  it("should accept the matching type and expose sub/jti", () => {
    const access = signAccessToken("u1", "access-jti");
    expect(verifyToken(access, "access")).toMatchObject({ sub: "u1", jti: "access-jti", type: "access" });
  });

  it("should reject malformed tokens", () => {
    expect(() => verifyToken("not-a-jwt", "access")).toThrow();
  });
});
