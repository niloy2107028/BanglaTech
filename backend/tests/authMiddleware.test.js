const test = require("node:test");
const assert = require("node:assert/strict");

const { extractTokenFromRequest } = require("../middleware/auth");

test("extractTokenFromRequest prefers cookie token when both cookie and bearer are present", () => {
  const result = extractTokenFromRequest({
    cookies: { token: "cookie-token" },
    headers: { authorization: "Bearer bearer-token" },
  });

  assert.deepEqual(result, {
    token: "cookie-token",
    source: "cookie",
  });
});

test("extractTokenFromRequest reads bearer authorization header", () => {
  const result = extractTokenFromRequest({
    cookies: {},
    headers: { authorization: "Bearer bearer-token" },
  });

  assert.deepEqual(result, {
    token: "bearer-token",
    source: "bearer",
  });
});

test("extractTokenFromRequest ignores malformed bearer header", () => {
  const result = extractTokenFromRequest({
    cookies: {},
    headers: { authorization: "Token bearer-token" },
  });

  assert.deepEqual(result, {
    token: "",
    source: "none",
  });
});
