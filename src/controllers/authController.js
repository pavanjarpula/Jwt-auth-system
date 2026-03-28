const bcrypt = require("bcrypt");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");

const SALT_ROUNDS = 12;

// ─── Register ────────────────────────────────────────────────────────────────

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Password must be at least 8 characters.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: "EMAIL_IN_USE",
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({
      message: "Account created successfully.",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("register error:", err);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Same message for both cases to avoid user enumeration
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    const payload = { id: user._id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user._id });

    // Persist the refresh token (expires in 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
    });

    return res.status(200).json({
      message: "Logged in successfully.",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("login error:", err);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ error: "MISSING_TOKEN", message: "refreshToken is required." });
    }

    // Verify the JWT signature and expiry first
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        // Clean it up from DB too
        await RefreshToken.deleteOne({ token: refreshToken });
        return res.status(401).json({
          error: "TOKEN_EXPIRED",
          message: "Refresh token has expired. Please log in again.",
        });
      }
      return res
        .status(401)
        .json({ error: "INVALID_TOKEN", message: "Invalid refresh token." });
    }

    // Check it exists in DB (not logged out)
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return res.status(401).json({
        error: "TOKEN_REVOKED",
        message: "Refresh token has been revoked. Please log in again.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ error: "USER_NOT_FOUND", message: "User no longer exists." });
    }

    const newAccessToken = signAccessToken({ id: user._id, email: user.email });

    return res.status(200).json({
      message: "Access token refreshed.",
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error("refresh error:", err);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ error: "MISSING_TOKEN", message: "refreshToken is required." });
    }

    // Delete the token — if it doesn't exist that's fine, still a success
    await RefreshToken.deleteOne({ token: refreshToken });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("logout error:", err);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

module.exports = { register, login, refresh, logout };
