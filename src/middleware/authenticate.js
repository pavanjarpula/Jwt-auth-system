const { verifyAccessToken } = require("../utils/token");

/**
 * Middleware: verifies the Bearer access token in the Authorization header.
 * Attaches the decoded payload to req.user on success.
 * Returns structured errors so the client knows exactly what went wrong.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "MISSING_TOKEN",
      message: "Authorization header with Bearer token is required.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "TOKEN_EXPIRED",
        message:
          "Your access token has expired. Please refresh it at POST /api/auth/refresh.",
      });
    }

    return res.status(401).json({
      error: "INVALID_TOKEN",
      message: "The provided token is invalid.",
    });
  }
}

module.exports = { authenticate };
