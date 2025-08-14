const express = require("express");
const router = express.Router();

const authController = require("../controller/authController");
const {
  userLoginSchema,
  passwordUpdateSchema,
  userRegistrationSchema,
} = require("../validation/schemas");
const { authenticateToken } = require("../middleware/auth");
const { validateBody } = require("../validation/validateBody");

router.post(
  "/register",
  validateBody(userRegistrationSchema),
  authController.register
);
router.post("/login", validateBody(userLoginSchema), authController.login);

router.get("/profile", authenticateToken, authController.getProfile);

router.patch(
  "/password",
  authenticateToken,
  validateBody(passwordUpdateSchema),
  authController.updatePassword
);

module.exports = router;

// {
//   "name": "abhishek chandrakant yadav",
//   "email": "abhishekyadav9594@email.com", 
//   "password": "@Abhiyadav9594",
//   "address": "123 Test Street, Test City, Test State, 12345"
// }