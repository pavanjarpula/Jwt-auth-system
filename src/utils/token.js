const jwt = require("jsonwebtoken");

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} = process.env;

/**
 * Signs a short-lived access token containing the user's id and email.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY || "15m",
  });
}

/**
 * Signs a long-lived refresh token containing only the user's id.
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY || "7d",
  });
}

/**
 * Verifies an access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

/**
 * Verifies a refresh token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
