const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({
      error: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid token. User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Invalid token.",
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions.",
      });
    }

    next();
  };
};

const requireAdmin = requireRole(["ADMIN"]);
const requireUser = requireRole(["USER"]);
const requireStoreOwner = requireRole(["STORE_OWNER"]);
const requireAdminOrStoreOwner = requireRole(["ADMIN", "STORE_OWNER"]);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireUser,
  requireStoreOwner,
  requireAdminOrStoreOwner,
};
