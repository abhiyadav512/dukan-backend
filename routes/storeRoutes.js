const express = require("express");
const router = express.Router();
const { z } = require("zod");

const storeController = require("../controller/storeController");
const { authenticateToken, requireStoreOwner } = require("../middleware/auth");
const { validateQuery } = require("../validation/validateBody");

router.use(authenticateToken, requireStoreOwner);

router.get("/dashboard", storeController.getDashboard);
router.get("/info", storeController.getStoreInfo);

router.get(
  "/ratings",
  validateQuery(
    z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
      sortBy: z
        .enum(["createdAt", "rating", "userName", "userEmail"])
        .optional()
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    })
  ),
  storeController.getRatingUsers
);

module.exports = router;
