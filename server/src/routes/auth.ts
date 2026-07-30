import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { getUserIdFromRequest, hashPassword, signToken, verifyPassword } from "../auth.js";

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  created_at: string;
}

function publicUser(user: UserRow) {
  return { id: user.id, email: user.email, displayName: user.display_name };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/register", async (request, reply) => {
    const { email, password, displayName } = request.body as {
      email?: string;
      password?: string;
      displayName?: string;
    };
    if (!email || !password || password.length < 8) {
      reply.code(400);
      return { error: "email and a password of at least 8 characters are required" };
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
    if (existing) {
      reply.code(409);
      return { error: "an account with this email already exists" };
    }

    const passwordHash = await hashPassword(password);
    const createdAt = new Date().toISOString();
    const info = db
      .prepare("INSERT INTO users (email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)")
      .run(normalizedEmail, passwordHash, displayName?.trim() || null, createdAt);
    const userId = Number(info.lastInsertRowid);
    db.prepare("INSERT INTO user_settings (user_id) VALUES (?)").run(userId);

    const token = signToken({ userId, email: normalizedEmail });
    return {
      data: { token, user: { id: userId, email: normalizedEmail, displayName: displayName?.trim() || null } },
    };
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    const { email, password } = request.body as { email?: string; password?: string };
    if (!email || !password) {
      reply.code(400);
      return { error: "email and password are required" };
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail) as UserRow | undefined;
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      reply.code(401);
      return { error: "invalid email or password" };
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { data: { token, user: publicUser(user) } };
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRow | undefined;
    if (!user) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    return { data: publicUser(user) };
  });
}
