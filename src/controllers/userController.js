const User = require("../models/User");

async function getMe(req, res) {
  try {
    // req.user is set by the authenticate middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ error: "USER_NOT_FOUND", message: "User not found." });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

module.exports = { getMe };
