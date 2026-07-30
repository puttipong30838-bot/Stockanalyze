import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { getUserIdFromRequest } from "../auth.js";

interface PostRow {
  id: number;
  user_id: number;
  symbol: string | null;
  body: string;
  created_at: string;
  author_email: string;
  author_display_name: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: number;
}

function publicPost(row: PostRow) {
  return {
    id: row.id,
    symbol: row.symbol,
    body: row.body,
    createdAt: row.created_at,
    author: { id: row.user_id, email: row.author_email, displayName: row.author_display_name },
    likeCount: row.like_count,
    commentCount: row.comment_count,
    likedByMe: !!row.liked_by_me,
  };
}

interface CommentRow {
  id: number;
  post_id: number;
  user_id: number;
  body: string;
  created_at: string;
  author_email: string;
  author_display_name: string | null;
}

function publicComment(row: CommentRow) {
  return {
    id: row.id,
    postId: row.post_id,
    body: row.body,
    createdAt: row.created_at,
    author: { id: row.user_id, email: row.author_email, displayName: row.author_display_name },
  };
}

export async function communityRoutes(app: FastifyInstance) {
  app.get("/api/v1/community/posts", async (request) => {
    const { symbol, userId, limit = "20", before } = request.query as {
      symbol?: string;
      userId?: string;
      limit?: string;
      before?: string;
    };
    const viewerId = getUserIdFromRequest(request);
    const take = Math.min(Number(limit) || 20, 50);

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (symbol) {
      conditions.push("p.symbol = ?");
      params.push(symbol);
    }
    if (userId) {
      conditions.push("p.user_id = ?");
      params.push(Number(userId));
    }
    if (before) {
      conditions.push("p.id < ?");
      params.push(Number(before));
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = db
      .prepare(
        `SELECT p.id, p.user_id, p.symbol, p.body, p.created_at,
                u.email as author_email, u.display_name as author_display_name,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
                (SELECT COUNT(*) FROM likes ml WHERE ml.post_id = p.id AND ml.user_id = ?) as liked_by_me
         FROM posts p
         JOIN users u ON u.id = p.user_id
         ${where}
         ORDER BY p.id DESC
         LIMIT ?`
      )
      .all(viewerId ?? -1, ...params, take) as PostRow[];

    return { data: rows.map(publicPost) };
  });

  app.post("/api/v1/community/posts", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const { symbol, body } = request.body as { symbol?: string; body?: string };
    if (!body || !body.trim()) {
      reply.code(400);
      return { error: "body is required" };
    }
    const createdAt = new Date().toISOString();
    const info = db
      .prepare("INSERT INTO posts (user_id, symbol, body, created_at) VALUES (?, ?, ?, ?)")
      .run(userId, symbol?.trim() || null, body.trim(), createdAt);
    const row = db
      .prepare(
        `SELECT p.id, p.user_id, p.symbol, p.body, p.created_at,
                u.email as author_email, u.display_name as author_display_name,
                0 as like_count, 0 as comment_count, 0 as liked_by_me
         FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
      )
      .get(Number(info.lastInsertRowid)) as PostRow;
    return { data: publicPost(row) };
  });

  app.post("/api/v1/community/posts/:id/like", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const { id } = request.params as { id: string };
    db.prepare("INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)").run(Number(id), userId);
    return { data: { liked: true } };
  });

  app.delete("/api/v1/community/posts/:id/like", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const { id } = request.params as { id: string };
    db.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?").run(Number(id), userId);
    return { data: { liked: false } };
  });

  app.get("/api/v1/community/posts/:id/comments", async (request) => {
    const { id } = request.params as { id: string };
    const rows = db
      .prepare(
        `SELECT c.id, c.post_id, c.user_id, c.body, c.created_at,
                u.email as author_email, u.display_name as author_display_name
         FROM comments c JOIN users u ON u.id = c.user_id
         WHERE c.post_id = ?
         ORDER BY c.id ASC`
      )
      .all(Number(id)) as CommentRow[];
    return { data: rows.map(publicComment) };
  });

  app.post("/api/v1/community/posts/:id/comments", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const { id } = request.params as { id: string };
    const { body } = request.body as { body?: string };
    if (!body || !body.trim()) {
      reply.code(400);
      return { error: "body is required" };
    }
    const createdAt = new Date().toISOString();
    const info = db
      .prepare("INSERT INTO comments (post_id, user_id, body, created_at) VALUES (?, ?, ?, ?)")
      .run(Number(id), userId, body.trim(), createdAt);
    const row = db
      .prepare(
        `SELECT c.id, c.post_id, c.user_id, c.body, c.created_at,
                u.email as author_email, u.display_name as author_display_name
         FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
      )
      .get(Number(info.lastInsertRowid)) as CommentRow;
    return { data: publicComment(row) };
  });

  app.post("/api/v1/community/users/:id/follow", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const { id } = request.params as { id: string };
    const followeeId = Number(id);
    if (followeeId === userId) {
      reply.code(400);
      return { error: "cannot follow yourself" };
    }
    db.prepare("INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)").run(
      userId,
      followeeId
    );
    return { data: { following: true } };
  });

  app.delete("/api/v1/community/users/:id/follow", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const { id } = request.params as { id: string };
    db.prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?").run(userId, Number(id));
    return { data: { following: false } };
  });

  app.get("/api/v1/community/users/:id/profile", async (request, reply) => {
    const { id } = request.params as { id: string };
    const profileId = Number(id);
    const user = db.prepare("SELECT id, email, display_name FROM users WHERE id = ?").get(profileId) as
      | { id: number; email: string; display_name: string | null }
      | undefined;
    if (!user) {
      reply.code(404);
      return { error: "user not found" };
    }
    const viewerId = getUserIdFromRequest(request);
    const postCount = (
      db.prepare("SELECT COUNT(*) as n FROM posts WHERE user_id = ?").get(profileId) as { n: number }
    ).n;
    const followerCount = (
      db.prepare("SELECT COUNT(*) as n FROM follows WHERE followee_id = ?").get(profileId) as {
        n: number;
      }
    ).n;
    const followingCount = (
      db.prepare("SELECT COUNT(*) as n FROM follows WHERE follower_id = ?").get(profileId) as {
        n: number;
      }
    ).n;
    const isFollowedByMe = viewerId
      ? !!db
          .prepare("SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?")
          .get(viewerId, profileId)
      : false;

    return {
      data: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        postCount,
        followerCount,
        followingCount,
        isFollowedByMe,
      },
    };
  });
}
