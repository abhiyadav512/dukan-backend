const express = require("express");
const router = express.Router();
const { z } = require("zod");

const userController = require("../controller/userController");
const { authenticateToken, requireUser } = require("../middleware/auth");
const { storeSearchSchema, ratingSubmissionSchema } = require("../validation/schemas");
const { validateQuery, validateBody } = require("../validation/validateBody");


router.use(authenticateToken, requireUser);

router.get(
  "/stores",
  validateQuery(storeSearchSchema),
  userController.getStores
);

router.post(
  "/ratings",
  validateBody(ratingSubmissionSchema),
  userController.submitRating
);

router.get(
  "/ratings",
  validateQuery(
    z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    })
  ),
  userController.getUserRatings
);

module.exports = router;
