const { z } = require("zod");

const formatZodErrors = (zodError) =>
  zodError.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      if (!schema || typeof schema.parse !== "function") {
        throw new Error("Invalid Zod schema passed to validateBody");
      }

      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatZodErrors(error),
        });
      }

      console.error("Non-validation error in validateBody:", error);
      return res.status(400).json({
        error: "Invalid request data",
      });
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Query validation failed",
          details: formatZodErrors(error),
        });
      }
      return res.status(400).json({
        error: "Invalid query parameters",
      });
    }
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Parameter validation failed",
          details: formatZodErrors(error),
        });
      }
      return res.status(400).json({
        error: "Invalid parameters",
      });
    }
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
};