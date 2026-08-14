import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";

const secret = getJwtSecret();

export type TokenPayload = {
  id: string;
  email: string;
  role: string;
  fullName: string;
};

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, secret, { expiresIn: "12h" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}
