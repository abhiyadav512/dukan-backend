const prisma = require("../config/db");

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    let averageRating = 0;
    if (store.ratings.length > 0) {
      const totalRating = store.ratings.reduce((sum, r) => sum + r.value, 0);
      averageRating = Number((totalRating / store.ratings.length).toFixed(2));
    }
    const ratingUsers = store.ratings.map((rating) => ({
      id: rating.id,
      value: rating.value,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
      user: rating.user,
    }));

    res.json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        averageRating,
        totalRatings: store.ratings.length,
        ratings: ratingUsers,
      },
    });
  } catch (error) {
    console.error("Store dashboard error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getRatingUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    const offset = (page - 1) * limit;

    const orderBy = {};
    if (sortBy === "userName") {
      orderBy.user = { name: sortOrder };
    } else if (sortBy === "userEmail") {
      orderBy.user = { email: sortOrder };
    } else if (sortBy === "rating") {
      orderBy.value = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }
    // console.log(orderBy);

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { storeId: store.id },
        skip: offset,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              address: true,
            },
          },
        },
        orderBy,
      }),
      prisma.rating.count({ where: { storeId: store.id } }),
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
    console.error("Get rating users error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getStoreInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        createdAt: true,
        ratings: {
          select: {
            value: true,
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    let averageRating = 0;
    if (store.ratings.length > 0) {
      const totalRating = store.ratings.reduce((sum, r) => sum + r.value, 0);
      averageRating = Number((totalRating / store.ratings.length).toFixed(2));
    }

    res.json({
      store: {
        ...store,
        averageRating,
        totalRatings: store.ratings.length,
        ratings: undefined,
      },
    });
  } catch (error) {
    console.error("Get store info error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  getDashboard,
  getRatingUsers,
  getStoreInfo,
};
