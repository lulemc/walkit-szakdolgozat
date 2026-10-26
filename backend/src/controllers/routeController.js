import routeService from "../services/routeService.js";
import Route from "../models/Route.js";
import { HttpError } from "../utils/httpError.js";
import { routeRequestProblem } from "../utils/routeRequest.js";

// Errors are thrown or passed on to middleware/errorHandler.js

const routeNotFound = () => new HttpError(404, "Route not found");

/** One of the user's own routes, or 404 */
const findMyRoute = async (req) => {
  const route = await Route.findOne({ _id: req.params.routeId, userId: req.user.id });
  if (!route) throw routeNotFound();
  return route;
};

export const generateRoute = async (req, res) => {
  const problem = routeRequestProblem(req.body);
  if (problem) throw new HttpError(400, problem);

  const route = await routeService.generateRoute(req.body, req.user.id);
  res.status(201).json({ success: true, data: route });
};

export const getUserRoutes = async (req, res) => {
  const routes = await routeService.getUserRoutes(req.user.id);
  res.json({ success: true, data: routes });
};

export const getRoute = async (req, res) => {
  const route = await routeService.getRoute(req.params.routeId, req.user.id);
  if (!route) throw routeNotFound();
  res.json({ success: true, data: route });
};

export const deleteRoute = async (req, res) => {
  const route = await routeService.deleteRoute(req.params.routeId, req.user.id);
  if (!route) throw routeNotFound();
  res.json({ success: true, message: "Route deleted successfully" });
};

/** Optional body: { name } for the favourite; unnamed routes get a name like "Circular 5.2km" */
export const addToFavorites = async (req, res) => {
  const route = await findMyRoute(req);

  route.isFavorite = true;
  route.favoritedAt = new Date();
  if (req.body.name) {
    route.name = req.body.name;
  } else if (!route.name) {
    const kind = route.type === "circular" ? "Circular" : "Point-to-Point";
    route.name = `${kind} ${(route.totalDistance / 1000).toFixed(1)}km`;
  }
  await route.save();

  res.json({ success: true, message: "Route added to favorites", data: route });
};

export const removeFromFavorites = async (req, res) => {
  const route = await findMyRoute(req);

  route.isFavorite = false;
  route.favoritedAt = null;
  await route.save();

  res.json({ success: true, message: "Route removed from favorites", data: route });
};

/** Most recently favourited first */
export const getFavoriteRoutes = async (req, res) => {
  const favorites = await Route.find({ userId: req.user.id, isFavorite: true }).sort({
    favoritedAt: -1,
  });
  res.json({ success: true, data: favorites });
};

export const updateRouteName = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) throw new HttpError(400, "Route name is required");

  const route = await findMyRoute(req);
  route.name = name;
  await route.save();

  res.json({ success: true, message: "Route name updated", data: route });
};

export const recordWalkCompletion = async (req, res) => {
  const route = await findMyRoute(req);

  route.lastWalkedAt = new Date();
  route.walkCount = (route.walkCount || 0) + 1;
  await route.save();

  res.json({
    success: true,
    message: "Walk recorded",
    data: { walkCount: route.walkCount, lastWalkedAt: route.lastWalkedAt },
  });
};
