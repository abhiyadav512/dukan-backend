const prisma = require("../config/db");

const getStores = async (req, res) => {
  try {
    const { name, address, page, limit, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    const where = {};
    if (name) where.name = { contains: name, mode: "insensitive" };
    if (address) where.address = { contains: address, mode: "insensitive" };

    const offset = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        include: {
          ratings: {
            select: {
              value: true,
              userId: true,
            },
          },
        },
      }),
      prisma.store.count({ where }),
    ]);

    let storesWithRatings = stores.map((store) => {
        console.log(store)
      const ratings = store.ratings;
      let averageRating = 0;
      let userRating = null;

      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
        averageRating = Number((totalRating / ratings.length).toFixed(2));

        const userRatingObj = ratings.find((r) => r.userId === userId);
        if (userRatingObj) {
          userRating = userRatingObj.rating;
        }
      }

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        averageRating,
        userRating,
        createdAt: store.createdAt,
      };
    });

    if (sortBy === "rating") {
      storesWithRatings.sort((a, b) => {
        return sortOrder === "asc"
          ? a.averageRating - b.averageRating
          : b.averageRating - a.averageRating;
      });
    }

    res.json({
      stores: storesWithRatings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get stores error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const submitRating = async (req, res) => {
  try {
    const { rating, storeId } = req.body;
    const userId = req.user.id;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    let result;
    if (existingRating) {
      result = await prisma.rating.update({
        where: {
          userId_storeId: {
            userId,
            storeId,
          },
        },
        data: { value:rating },
        include: {
          store: {
            select: {
              name: true,
            },
          },
        },
      });
    } else {
      result = await prisma.rating.create({
        data: {
          value:rating,
          userId,
          storeId,
        },
        include: {
          store: {
            select: {
              name: true,
            },
          },
        },
      });
    }

    res.json({
      message: existingRating
        ? "Rating updated successfully"
        : "Rating submitted successfully",
      rating: result,
    });
  } catch (error) {
    console.error("Submit rating error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getUserRatings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      prisma.rating.count({ where: { userId } }),
    ]);

    res.json({
      ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user ratings error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  getStores,
  submitRating,
  getUserRatings,
};
