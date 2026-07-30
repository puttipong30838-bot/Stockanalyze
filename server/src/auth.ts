import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { FastifyRequest } from "fastify";

// Falls back to a fixed dev secret when JWT_SECRET isn't set, since this is a
// free/no-external-service app; production deployments should set JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET ?? "stockpulse-dev-insecure-secret-change-me";

export interface TokenPayload {
  userId: number;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(request: FastifyRequest): number | null {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.slice("Bearer ".length));
  return payload?.userId ?? null;
}
