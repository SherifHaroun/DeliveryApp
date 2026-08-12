import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "dev-secret";

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
