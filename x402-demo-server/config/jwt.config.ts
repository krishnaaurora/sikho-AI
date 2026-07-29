import { env } from "./env";

export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: "1d",
  refreshExpiresIn: "7d",
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
