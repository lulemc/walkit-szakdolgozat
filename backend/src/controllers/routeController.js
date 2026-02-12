import routeService from "../services/routeService.js";

/**
 * POST /api/routes/generate
 * Generate a new walking route
 */
export const generateRoute = async (req, res) => {
  try {
    const userId = req.user._id; // From protect middleware

    const request = req.body;

    // Validate based on route type
    if (!request.startLocation || !request.routeType) {
      return res.status(400).json({
        message: "Missing required fields: startLocation, routeType",
      });
    }

    // For circular routes, distance is required
    if (request.routeType === "circular" && !request.distance) {
      return res.status(400).json({
        message: "Missing required field for circular route: distance",
      });
    }

    // For point-to-point routes, destination is required
    if (
      request.routeType === "point-to-point" &&
      !request.destinationLocation
    ) {
      return res.status(400).json({
        message:
          "Missing required field for point-to-point route: destinationLocation",
      });
    }

    // Set default preferences if not provided
    if (!request.preferences) {
      request.preferences = {
        parks: false,
        waterfront: false,
        avoidHighways: false,
        scenic: false,
      };
    }

    // Generate route
    const route = await routeService.generateRoute(request, userId);

    res.status(201).json({
      message: "Route generated successfully",
      route,
    });
  } catch (error) {
    console.error("Error generating route:", error);
    res.status(400).json({
      message: error.message || "Failed to generate route",
    });
  }
};

/**
 * GET /api/routes/user/:userId
 * Get all routes for a user
 */
export const getUserRoutes = async (req, res) => {
  try {
    const userId = req.user._id;
    const requestedUserId = req.params.userId;

    // Users can only access their own routes
    if (userId.toString() !== requestedUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const routes = await routeService.getUserRoutes(userId);

    res.json({
      message: "Routes retrieved successfully",
      count: routes.length,
      routes,
    });
  } catch (error) {
    console.error("Error fetching user routes:", error);
    res.status(500).json({
      message: "Failed to fetch routes",
    });
  }
};

/**
 * GET /api/routes/:routeId
 * Get a single route by ID
 */
export const getRoute = async (req, res) => {
  try {
    const userId = req.user._id;
    const routeId = req.params.routeId;

    const route = await routeService.getRoute(routeId, userId);

    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    res.json({
      message: "Route retrieved successfully",
      route,
    });
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({
      message: "Failed to fetch route",
    });
  }
};

/**
 * DELETE /api/routes/:routeId
 * Delete a route
 */
export const deleteRoute = async (req, res) => {
  try {
    const userId = req.user._id;
    const routeId = req.params.routeId;

    const deleted = await routeService.deleteRoute(routeId, userId);

    if (!deleted) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    res.json({
      message: "Route deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({
      message: "Failed to delete route",
    });
  }
};
