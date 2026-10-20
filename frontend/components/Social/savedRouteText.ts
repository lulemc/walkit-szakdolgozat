import { Route, routeService } from "@/services/routeService";

/** The route's name, or its kind for routes that were never named */
export const routeTitle = (route: Route): string =>
  route.name ?? (route.type === "circular" ? "Circular route" : "Point-to-point route");

/** Distance, walking time and where it starts, e.g. "5.2km · 1h 5m · Budapest" */
export const routeDetails = (route: Route): string =>
  [
    routeService.formatDistance(route.totalDistance),
    routeService.formatDuration(route.estimatedDuration),
    route.startLocation?.address,
  ]
    .filter(Boolean)
    .join(" · ");
