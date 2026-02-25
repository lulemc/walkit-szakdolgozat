import routeService from "../services/routeService.js";
import Route from "../models/Route.js";

/**
 * Generate a new route
 */
export const generateRoute = async (req, res) => {
  try {
    const userId = req.user.id;
    const routeData = req.body;

    console.log("📍 Route generation request:", {
      userId,
      type: routeData.routeType,
      distance: routeData.distance,
    });

    const route = await routeService.generateRoute(routeData, userId);

    res.status(201).json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error("❌ Error generating route:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate route",
    });
  }
};

/**
 * Get all routes for user
 */
export const getUserRoutes = async (req, res) => {
  try {
    const userId = req.user.id;
    const routes = await routeService.getUserRoutes(userId);

    res.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch routes",
    });
  }
};

/**
 * Get a specific route
 */
export const getRoute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { routeId } = req.params;

    const route = await routeService.getRoute(routeId, userId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch route",
    });
  }
};

/**
 * Delete a route
 */
export const deleteRoute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { routeId } = req.params;

    const route = await routeService.deleteRoute(routeId, userId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete route",
    });
  }
};

/**
 * Add route to favorites
 */
export const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { routeId } = req.params;
    const { name } = req.body; // Optional custom name

    console.log(`⭐ Adding route ${routeId} to favorites for user ${userId}`);

    // Find route and verify ownership
    const route = await Route.findOne({ _id: routeId, userId });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    // Update to favorite
    route.isFavorite = true;
    route.favoritedAt = new Date();

    // Set custom name if provided
    if (name) {
      route.name = name;
    } else if (!route.name) {
      // Auto-generate name if not provided
      route.name = `${route.type === "circular" ? "Circular" : "Point-to-Point"} ${(route.totalDistance / 1000).toFixed(1)}km`;
    }

    await route.save();

    console.log("✅ Route added to favorites");

    res.json({
      success: true,
      message: "Route added to favorites",
      data: route,
    });
  } catch (error) {
    console.error("❌ Error adding to favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add route to favorites",
    });
  }
};

/**
 * Remove route from favorites
 */
export const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { routeId } = req.params;

    console.log(
      `❌ Removing route ${routeId} from favorites for user ${userId}`,
    );

    const route = await Route.findOne({ _id: routeId, userId });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    route.isFavorite = false;
    route.favoritedAt = null;
    await route.save();

    console.log("✅ Route removed from favorites");

    res.json({
      success: true,
      message: "Route removed from favorites",
      data: route,
    });
  } catch (error) {
    console.error("❌ Error removing from favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove route from favorites",
    });
  }
};

/**
 * Get favorite routes
 */
export const getFavoriteRoutes = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`⭐ Fetching favorite routes for user ${userId}`);

    const favorites = await Route.find({
      userId,
      isFavorite: true,
    }).sort({ favoritedAt: -1 }); // Most recently favorited first

    console.log(`✅ Found ${favorites.length} favorite routes`);

    res.json({
      success: true,
      data: favorites,
      count: favorites.length,
    });
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorite routes",
    });
  }
};

/**
 * Update route name
 */
export const updateRouteName = async (req, res) => {
  try {
    const userId = req.user.id;
    const { routeId } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Route name is required",
      });
    }

    const route = await Route.findOne({ _id: routeId, userId });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    route.name = name.trim();
    await route.save();

    res.json({
      success: true,
      message: "Route name updated",
      data: route,
    });
  } catch (error) {
    console.error("Error updating route name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update route name",
    });
  }
};

/**
 * Record walk completion
 */
export const recordWalkCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { routeId } = req.params;

    const route = await Route.findOne({ _id: routeId, userId });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    route.lastWalkedAt = new Date();
    route.walkCount = (route.walkCount || 0) + 1;
    await route.save();

    console.log(
      `🚶 Walk completed: Route ${routeId}, Count: ${route.walkCount}`,
    );

    res.json({
      success: true,
      message: "Walk recorded",
      data: {
        walkCount: route.walkCount,
        lastWalkedAt: route.lastWalkedAt,
      },
    });
  } catch (error) {
    console.error("Error recording walk:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record walk completion",
    });
  }
};
