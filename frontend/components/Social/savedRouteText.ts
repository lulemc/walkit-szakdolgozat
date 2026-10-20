import { Route, routeService } from "@/services/routeService";

/** The fields used here; saved routes and a group walk's copy of a route both have them */
type RouteText = Pick<
  Route,
  "name" | "type" | "totalDistance" | "estimatedDuration" | "startLocation"
>;

/** The route's name, or its kind for routes that were never named */
export const routeTitle = (route: RouteText): string =>
  route.name ?? (route.type === "circular" ? "Circular route" : "Point-to-point route");

/** Distance, walking time and where it starts, e.g. "5.2km · 1h 5m · Budapest" */
export const routeDetails = (route: RouteText): string =>
  [
    routeService.formatDistance(route.totalDistance),
    routeService.formatDuration(route.estimatedDuration),
    route.startLocation?.address,
  ]
    .filter(Boolean)
    .join(" · ");
