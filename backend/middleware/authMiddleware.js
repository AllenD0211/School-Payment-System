const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const getBearerToken = (authorizationHeader) => {
  const header = String(authorizationHeader || "").trim();
  if (!header) return "";

  const [scheme, token] = header.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return "";
  return token.trim();
};

const authenticate = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = String(decoded?.id || "").trim();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: invalid token payload" });
    }

    const user = await User.findById(userId).select("_id email userType").lean();
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      userType: user.userType
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin access required" });
  }

  return next();
};

module.exports = {
  authenticate,
  requireAdmin
};
