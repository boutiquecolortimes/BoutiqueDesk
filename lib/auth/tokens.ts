import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Role } from "./roles";
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "./cookies";

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  role: Role;
  email: string;
  name: string;
  storeIds: string[];
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  tokenVersion: number;
}

function getSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET") {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env.local (see .env.local.example).`
    );
  }
  return new TextEncoder().encode(value);
}

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(getSecret("JWT_ACCESS_SECRET"));
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret("JWT_ACCESS_SECRET"));
  return payload as AccessTokenPayload;
}

export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(getSecret("JWT_REFRESH_SECRET"));
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret("JWT_REFRESH_SECRET"));
  return payload as RefreshTokenPayload;
}
