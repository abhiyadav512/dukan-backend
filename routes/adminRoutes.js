const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const adminController = require("../controller/adminController");
const {
  validateQuery,
  validateBody,
} = require("../validation/validateBody");
const {
  userListSchema,
  adminCreateUserSchema,
  storeCreationSchema,
  storeListSchema,
} = require("../validation/schemas");

router.use(authenticateToken, requireAdmin);

router.get("/dashboard", adminController.getDashboard);

router.post(
  "/users",
  validateBody(adminCreateUserSchema),
  adminController.createUser
);
router.get("/users", validateQuery(userListSchema), adminController.getUsers);

router.post(
  "/stores",
  validateBody(storeCreationSchema),
  adminController.createStore
);

router.get(
  "/stores",
  validateQuery(storeListSchema),
  adminController.getStores
);

module.exports = router;
