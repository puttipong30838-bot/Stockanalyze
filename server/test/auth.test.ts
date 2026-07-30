import { beforeEach, describe, expect, it } from "vitest";

const { buildServer } = await import("../src/index.js");
const { db } = await import("../src/db.js");

beforeEach(() => {
  db.exec("DELETE FROM user_watchlist; DELETE FROM user_settings; DELETE FROM users;");
});

async function register(app: ReturnType<typeof buildServer>, email: string, password: string) {
  return app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: { email, password },
  });
}

describe("POST /api/v1/auth/register", () => {
  it("creates an account and returns a token", async () => {
    const app = buildServer();
    const res = await register(app, "trader@example.com", "correcthorse");
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.email).toBe("trader@example.com");
    await app.close();
  });

  it("rejects a short password", async () => {
    const app = buildServer();
    const res = await register(app, "trader2@example.com", "short");
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("rejects a duplicate email", async () => {
    const app = buildServer();
    await register(app, "dup@example.com", "correcthorse");
    const res = await register(app, "dup@example.com", "correcthorse");
    expect(res.statusCode).toBe(409);
    await app.close();
  });
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const app = buildServer();
    await register(app, "login@example.com", "correcthorse");
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "login@example.com", password: "correcthorse" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.token).toBeTruthy();
    await app.close();
  });

  it("rejects wrong password", async () => {
    const app = buildServer();
    await register(app, "wrongpw@example.com", "correcthorse");
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "wrongpw@example.com", password: "wrongpassword" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

describe("GET /api/v1/auth/me", () => {
  it("requires a bearer token", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/auth/me" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("returns the current user for a valid token", async () => {
    const app = buildServer();
    const regRes = await register(app, "me@example.com", "correcthorse");
    const token = regRes.json().data.token;
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.email).toBe("me@example.com");
    await app.close();
  });
});

describe("GET/PUT /api/v1/user/watchlist", () => {
  it("requires auth", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/user/watchlist" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("persists a replaced watchlist for the logged-in user", async () => {
    const app = buildServer();
    const regRes = await register(app, "watch@example.com", "correcthorse");
    const token = regRes.json().data.token;
    const putRes = await app.inject({
      method: "PUT",
      url: "/api/v1/user/watchlist",
      headers: { authorization: `Bearer ${token}` },
      payload: { symbols: ["AAPL", "PTT.BK"] },
    });
    expect(putRes.statusCode).toBe(200);
    const getRes = await app.inject({
      method: "GET",
      url: "/api/v1/user/watchlist",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getRes.json().data.sort()).toEqual(["AAPL", "PTT.BK"].sort());
    await app.close();
  });
});

describe("GET/PUT /api/v1/user/settings", () => {
  it("returns defaults for a fresh account", async () => {
    const app = buildServer();
    const regRes = await register(app, "settings@example.com", "correcthorse");
    const token = regRes.json().data.token;
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/user/settings",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.json().data).toEqual({ language: "th", newsLanguage: "th", mode: "investor" });
    await app.close();
  });

  it("persists updated settings", async () => {
    const app = buildServer();
    const regRes = await register(app, "settings2@example.com", "correcthorse");
    const token = regRes.json().data.token;
    await app.inject({
      method: "PUT",
      url: "/api/v1/user/settings",
      headers: { authorization: `Bearer ${token}` },
      payload: { language: "en", newsLanguage: "en", mode: "trader" },
    });
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/user/settings",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.json().data).toEqual({ language: "en", newsLanguage: "en", mode: "trader" });
    await app.close();
  });
});
