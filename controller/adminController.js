const bcrypt = require("bcrypt");
const prisma = require("../config/db");

const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.rating.count(),
    ]);

    res.json({
      dashboard: {
        totalUsers,
        totalStores,
        totalRatings,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      role,
      page = 1,
      limit = 10,
      minRating,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const where = {};
    if (name) where.name = { contains: name, mode: "insensitive" };
    if (email) where.email = { contains: email, mode: "insensitive" };
    if (address) where.address = { contains: address, mode: "insensitive" };
    if (role) where.role = role.toUpperCase();

    // Fetch more users to apply rating filter correctly
    const users = await prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
        ownedStore: {
          select: {
            id: true,
            name: true,
            ratings: {
              select: { value: true },
            },
          },
        },
      },
    });

    // Calculate average rating
    let usersWithRatings = users.map((user) => {
      const ratings = user.ownedStore?.ratings || [];
      const avgRating =
        ratings.length > 0
          ? Number(
              (
                ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
              ).toFixed(2)
            )
          : 0;
      if (user.ownedStore) {
        user.ownedStore.averageRating = avgRating;
        delete user.ownedStore.ratings;
      }
      return user;
    });

    // Filter by minRating if provided
    if (minRating) {
      usersWithRatings = usersWithRatings.filter(
        (user) => (user.ownedStore?.averageRating || 0) >= Number(minRating)
      );
    }

    const total = usersWithRatings.length;
    const currentPage = Number(page);
    const perPage = Number(limit);
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    const paginatedUsers = usersWithRatings.slice(start, end);

    res.json({
      users: paginatedUsers,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const createStore = async (req, res) => {
  try {
    const { name, email, address } = req.body;

    const existingStore = await prisma.store.findUnique({
      where: { email },
    });

    if (existingStore) {
      return res.status(400).json({
        error: "Store with this email already exists",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
      include: { ownedStore: true },
    });

    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    if (user.store) {
      return res.status(400).json({
        error: "User is already a store owner",
      });
    }

    const store = await prisma.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          name,
          email,
          address,
          owner: {
            connect: { id: user.id },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { role: "STORE_OWNER" },
      });

      return newStore;
    });

    res.status(201).json({
      message: "Store created successfully",
      store,
    });
  } catch (error) {
    console.error("Create store error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getStores = async (req, res) => {
  try {
    const { name, email, address, page, limit, sortBy, sortOrder } = req.query;

    const where = {};
    if (name) where.name = { contains: name, mode: "insensitive" };
    if (email) where.email = { contains: email, mode: "insensitive" };
    if (address) where.address = { contains: address, mode: "insensitive" };

    const offset = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
          ratings: {
            select: {
              value: true,
            },
          },
        },
      }),

      prisma.store.count({ where }),
    ]);

    let storesWithRatings = stores.map((store) => {
      const ratings = store.ratings;
      let averageRating = 0;

      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, r) => sum + r.value, 0);
        averageRating = Number((totalRating / ratings.length).toFixed(2));
      }

      return {
        ...store,
        averageRating,
        ratings: undefined,
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

module.exports = {
  getDashboard,
  createUser,
  getUsers,
  createStore,
  getStores,
};
