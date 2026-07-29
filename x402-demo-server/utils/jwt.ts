import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.config";

export const generateToken = (payload: any) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn as any,
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, jwtConfig.secret);
};

export const decodeToken = (token: string) => {
  return jwt.decode(token);
};