import { beforeEach, describe, expect, it } from "vitest";

const { buildServer } = await import("../src/index.js");
const { db } = await import("../src/db.js");

beforeEach(() => {
  db.exec(
    "DELETE FROM likes; DELETE FROM comments; DELETE FROM follows; DELETE FROM posts; DELETE FROM user_watchlist; DELETE FROM user_settings; DELETE FROM users;"
  );
});

async function registerAndGetToken(app: ReturnType<typeof buildServer>, email: string) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: { email, password: "correcthorse" },
  });
  const body = res.json();
  return { token: body.data.token as string, userId: body.data.user.id as number };
}

describe("GET/POST /api/v1/community/posts", () => {
  it("lets a guest read an empty feed", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/community/posts" });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([]);
    await app.close();
  });

  it("requires auth to create a post", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/community/posts",
      payload: { body: "hello" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("creates a post and lists it in the feed", async () => {
    const app = buildServer();
    const { token } = await registerAndGetToken(app, "poster@example.com");
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/community/posts",
      headers: { authorization: `Bearer ${token}` },
      payload: { symbol: "AAPL", body: "AAPL looking strong today" },
    });
    expect(createRes.statusCode).toBe(200);
    expect(createRes.json().data.likeCount).toBe(0);

    const feedRes = await app.inject({ method: "GET", url: "/api/v1/community/posts" });
    const posts = feedRes.json().data;
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toBe("AAPL looking strong today");
    expect(posts[0].author.email).toBe("poster@example.com");
    await app.close();
  });

  it("filters the feed by symbol", async () => {
    const app = buildServer();
    const { token } = await registerAndGetToken(app, "filterer@example.com");
    await app.inject({
      method: "POST",
      url: "/api/v1/community/posts",
      headers: { authorization: `Bearer ${token}` },
      payload: { symbol: "AAPL", body: "about apple" },
    });
    await app.inject({
      method: "POST",
      url: "/api/v1/community/posts",
      headers: { authorization: `Bearer ${token}` },
      payload: { symbol: "PTT.BK", body: "about ptt" },
    });
    const res = await app.inject({ method: "GET", url: "/api/v1/community/posts?symbol=AAPL" });
    const posts = res.json().data;
    expect(posts).toHaveLength(1);
    expect(posts[0].symbol).toBe("AAPL");
    await app.close();
  });
});

describe("like/unlike a post", () => {
  it("toggles like state and count", async () => {
    const app = buildServer();
    const { token } = await registerAndGetToken(app, "liker@example.com");
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/community/posts",
      headers: { authorization: `Bearer ${token}` },
      payload: { body: "like me" },
    });
    const postId = createRes.json().data.id;

    await app.inject({
      method: "POST",
      url: `/api/v1/community/posts/${postId}/like`,
      headers: { authorization: `Bearer ${token}` },
    });
    const afterLike = await app.inject({ method: "GET", url: "/api/v1/community/posts" });
    expect(afterLike.json().data[0].likeCount).toBe(1);
    expect(afterLike.json().data[0].likedByMe).toBe(false); // no auth header on this GET

    const afterLikeAuthed = await app.inject({
      method: "GET",
      url: "/api/v1/community/posts",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(afterLikeAuthed.json().data[0].likedByMe).toBe(true);

    await app.inject({
      method: "DELETE",
      url: `/api/v1/community/posts/${postId}/like`,
      headers: { authorization: `Bearer ${token}` },
    });
    const afterUnlike = await app.inject({ method: "GET", url: "/api/v1/community/posts" });
    expect(afterUnlike.json().data[0].likeCount).toBe(0);
    await app.close();
  });
});

describe("comments", () => {
  it("creates and lists comments on a post", async () => {
    const app = buildServer();
    const { token } = await registerAndGetToken(app, "commenter@example.com");
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/community/posts",
      headers: { authorization: `Bearer ${token}` },
      payload: { body: "discuss me" },
    });
    const postId = createRes.json().data.id;

    const commentRes = await app.inject({
      method: "POST",
      url: `/api/v1/community/posts/${postId}/comments`,
      headers: { authorization: `Bearer ${token}` },
      payload: { body: "great point!" },
    });
    expect(commentRes.statusCode).toBe(200);

    const listRes = await app.inject({
      method: "GET",
      url: `/api/v1/community/posts/${postId}/comments`,
    });
    expect(listRes.json().data).toHaveLength(1);
    expect(listRes.json().data[0].body).toBe("great point!");
    await app.close();
  });
});

describe("follow/unfollow and profile", () => {
  it("follows a user and reflects it in profile counts", async () => {
    const app = buildServer();
    const a = await registerAndGetToken(app, "a@example.com");
    const b = await registerAndGetToken(app, "b@example.com");

    const followRes = await app.inject({
      method: "POST",
      url: `/api/v1/community/users/${b.userId}/follow`,
      headers: { authorization: `Bearer ${a.token}` },
    });
    expect(followRes.statusCode).toBe(200);

    const profileRes = await app.inject({
      method: "GET",
      url: `/api/v1/community/users/${b.userId}/profile`,
      headers: { authorization: `Bearer ${a.token}` },
    });
    const profile = profileRes.json().data;
    expect(profile.followerCount).toBe(1);
    expect(profile.isFollowedByMe).toBe(true);

    await app.inject({
      method: "DELETE",
      url: `/api/v1/community/users/${b.userId}/follow`,
      headers: { authorization: `Bearer ${a.token}` },
    });
    const profileAfter = await app.inject({
      method: "GET",
      url: `/api/v1/community/users/${b.userId}/profile`,
    });
    expect(profileAfter.json().data.followerCount).toBe(0);
    await app.close();
  });

  it("rejects following yourself", async () => {
    const app = buildServer();
    const a = await registerAndGetToken(app, "self@example.com");
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/community/users/${a.userId}/follow`,
      headers: { authorization: `Bearer ${a.token}` },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
