import swaggerJSDoc from "swagger-jsdoc";

/* Every response is `{ success, data?, message? }`; these keep the paths below short */
const json = (schema) => ({ "application/json": { schema } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const ok = (description, data) => ({
  description,
  content: json({
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string" },
      ...(data && { data }),
    },
  }),
});
const fail = (description) => ({ description, content: json(ref("ErrorResponse")) });
const routeIdParam = {
  in: "path",
  name: "routeId",
  required: true,
  schema: { type: "string" },
  description: "Route id",
};
const userIdParam = {
  in: "path",
  name: "id",
  required: true,
  schema: { type: "string" },
  description: "My own user id",
};

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WalkIt API",
      version: "1.0.0",
      description: "API documentation for WalkIt - Walking Route Generator",
    },
    servers: [
      {
        url: "http://localhost:4000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          description: "The logged-in user's own profile (never the password hash)",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            dateOfBirth: { type: "string", format: "date-time" },
            sex: { type: "string", enum: ["male", "female", "other"] },
            height: { type: "number", minimum: 50, maximum: 300, description: "cm" },
            weight: { type: "number", minimum: 20, maximum: 500, description: "kg" },
            activityLevel: {
              type: "string",
              enum: ["sedentary", "light", "moderate", "active", "very_active"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 50 },
            email: { type: "string", format: "email" },
            currentPassword: { type: "string", description: "Required when changing the email" },
            dateOfBirth: { type: "string", format: "date-time" },
            sex: { type: "string", enum: ["male", "female", "other"] },
            height: { type: "number" },
            weight: { type: "number" },
            activityLevel: { type: "string" },
          },
        },
        AuthRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              maxLength: 50,
              description: "Shown to other users, e.g. in friend search",
            },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string", description: "Send as `Authorization: Bearer <token>`; valid for 7 days" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        // Route schemas
        Coordinates: {
          type: "object",
          required: ["latitude", "longitude"],
          properties: {
            latitude: {
              type: "number",
              example: 47.4979,
              description: "Latitude coordinate",
            },
            longitude: {
              type: "number",
              example: 19.0402,
              description: "Longitude coordinate",
            },
          },
        },
        RoutePreferences: {
          type: "object",
          properties: {
            parks: {
              type: "boolean",
              example: true,
              description: "Prefer routes through parks and green spaces",
            },
            waterfront: {
              type: "boolean",
              example: true,
              description: "Prefer routes near water (rivers, lakes, canals)",
            },
            avoidHighways: {
              type: "boolean",
              example: true,
              description: "Avoid busy highways and main roads",
            },
            scenic: {
              type: "boolean",
              example: false,
              description:
                "Prefer routes with scenic viewpoints and attractions",
            },
            uphill: {
              type: "boolean",
              example: false,
              description: "Prefer routes with elevation gain and hills",
            },
            mountain: {
              type: "boolean",
              example: false,
              description: "Prefer routes on mountain trails and paths",
            },
          },
        },
        GenerateRouteRequest: {
          type: "object",
          required: ["startLocation", "distance", "routeType"],
          properties: {
            startLocation: {
              $ref: "#/components/schemas/Coordinates",
            },
            destinationLocation: {
              $ref: "#/components/schemas/Coordinates",
              description: "Required for point-to-point routes",
            },
            distance: {
              type: "number",
              example: 5,
              description: "Target distance in kilometers (max 50)",
            },
            routeType: {
              type: "string",
              enum: ["circular", "point-to-point"],
              example: "circular",
              description: "Type of route to generate",
            },
            preferences: {
              $ref: "#/components/schemas/RoutePreferences",
            },
          },
        },
        Route: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["draft", "saved"],
              description:
                "Generated routes are drafts, removed after 7 days unless favourited, named, walked or used for a group walk",
            },
            draftExpiresAt: { type: "string", format: "date-time", description: "Drafts only" },
            _id: { type: "string", example: "65a1b2c3d4e5f6789012" },
            userId: { type: "string", example: "65a1b2c3d4e5f6789013" },
            type: {
              type: "string",
              enum: ["circular", "point-to-point"],
              example: "circular",
            },
            startLocation: {
              type: "object",
              properties: {
                latitude: { type: "number", example: 47.4979 },
                longitude: { type: "number", example: 19.0402 },
                address: { type: "string", example: "Heroes Square, Budapest" },
              },
            },
            endLocation: {
              type: "object",
              properties: {
                latitude: { type: "number", example: 47.4979 },
                longitude: { type: "number", example: 19.0402 },
                address: { type: "string", example: "Heroes Square, Budapest" },
              },
            },
            coordinates: {
              type: "array",
              items: { $ref: "#/components/schemas/Coordinates" },
              description: "Full path coordinates for drawing route on map",
            },
            totalDistance: {
              type: "number",
              example: 5200,
              description: "Total distance in meters",
            },
            estimatedDuration: {
              type: "number",
              example: 57,
              description: "Estimated duration in minutes",
            },
            preferenceScore: {
              type: "number",
              example: 85,
              description:
                "Score based on how well route matches preferences (0-100)",
            },
            preferences: { $ref: "#/components/schemas/RoutePreferences" },
            // elevation fields
            elevationGain: {
              type: "number",
              example: 150,
              description: "Total elevation gain in meters",
            },
            elevationLoss: {
              type: "number",
              example: 145,
              description: "Total elevation loss in meters",
            },
            maxElevation: {
              type: "number",
              example: 250,
              description: "Highest point on route in meters",
            },
            minElevation: {
              type: "number",
              example: 100,
              description: "Lowest point on route in meters",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-02-09T12:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-02-09T12:00:00.000Z",
            },
          },
        },
        FriendUser: {
          type: "object",
          properties: {
            _id: { type: "string", example: "65a1b2c3d4e5f6789013" },
            name: { type: "string", example: "Ann" },
          },
        },
        Friend: {
          type: "object",
          properties: {
            friendshipId: { type: "string" },
            user: { $ref: "#/components/schemas/FriendUser" },
            since: { type: "string", format: "date-time" },
          },
        },
        FriendRequest: {
          type: "object",
          properties: {
            _id: { type: "string", description: "Friend request id" },
            user: { $ref: "#/components/schemas/FriendUser" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Friendship: {
          type: "object",
          properties: {
            _id: { type: "string" },
            requester: { type: "string" },
            recipient: { type: "string" },
            status: { type: "string", enum: ["pending", "accepted"] },
            acceptedAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        UserSearchResult: {
          type: "object",
          description: "A user found by search. Email addresses are never returned.",
          properties: {
            _id: { type: "string", example: "65a1b2c3d4e5f6789013" },
            name: { type: "string", example: "Ann" },
            relationship: {
              type: "string",
              enum: ["none", "friends", "outgoing", "incoming"],
              description:
                "friends: already friends; outgoing: I sent a pending request; incoming: they sent me one",
            },
            friendshipId: {
              type: "string",
              description: "The friendship or request id, when relationship isn't none",
            },
          },
        },
        GroupWalkParticipant: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/FriendUser" },
            role: { type: "string", enum: ["organiser", "invitee"] },
            status: { type: "string", enum: ["invited", "accepted", "declined"] },
            invitedAt: { type: "string", format: "date-time" },
            respondedAt: { type: "string", format: "date-time" },
          },
        },
        GroupWalkCounts: {
          type: "object",
          properties: {
            accepted: { type: "integer" },
            invited: { type: "integer" },
            declined: { type: "integer" },
          },
        },
        GroupWalkSummary: {
          type: "object",
          description: "A walk in a list. The route has no coordinates here; load the detail for the map.",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            scheduledAt: { type: "string", format: "date-time" },
            status: { type: "string", enum: ["scheduled", "cancelled"] },
            organiser: { $ref: "#/components/schemas/FriendUser" },
            route: {
              type: "object",
              description: "Copy of the route (name, type, totalDistance, estimatedDuration, startLocation, ...)",
            },
            myStatus: { type: "string", enum: ["invited", "accepted", "declined"] },
            counts: { $ref: "#/components/schemas/GroupWalkCounts" },
          },
        },
        GroupWalkDetail: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            note: { type: "string" },
            scheduledAt: { type: "string", format: "date-time" },
            status: { type: "string", enum: ["scheduled", "cancelled"] },
            cancelledAt: { type: "string", format: "date-time" },
            organiser: { $ref: "#/components/schemas/FriendUser" },
            route: {
              type: "object",
              description:
                "Copy of the route taken when the walk was planned, including coordinates; unaffected if the original route changes or is deleted",
            },
            participants: {
              type: "array",
              items: { $ref: "#/components/schemas/GroupWalkParticipant" },
            },
            myStatus: { type: "string", enum: ["invited", "accepted", "declined"] },
            isOrganiser: { type: "boolean" },
            counts: { $ref: "#/components/schemas/GroupWalkCounts" },
          },
        },
        CreateGroupWalkRequest: {
          type: "object",
          required: ["routeId", "scheduledAt"],
          properties: {
            routeId: { type: "string", description: "One of my saved routes" },
            scheduledAt: {
              type: "string",
              format: "date-time",
              description: "Must be in the future (send in UTC, e.g. toISOString())",
            },
            title: { type: "string", maxLength: 80 },
            note: { type: "string", maxLength: 500 },
            inviteeIds: {
              type: "array",
              items: { type: "string" },
              description: "Friends to invite (at most 19, so 20 participants with me)",
            },
          },
        },
        GroupWalkComment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            author: { $ref: "#/components/schemas/FriendUser" },
            text: { type: "string", maxLength: 500 },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        SocialSummary: {
          type: "object",
          description: "Counts for the app's Social badge",
          properties: {
            pendingFriendRequests: {
              type: "integer",
              description: "Friend requests sent to me that I haven't answered",
            },
            pendingInvitations: {
              type: "integer",
              description: "Invitations to upcoming, not cancelled walks that I haven't answered",
            },
          },
        },
        RecordWalkRequest: {
          type: "object",
          required: ["startedAt", "endedAt", "durationSec", "distanceM"],
          properties: {
            routeId: { type: "string", description: "One of my saved routes; its walk count is increased" },
            groupWalkId: { type: "string", description: "A group walk I take part in" },
            startedAt: { type: "string", format: "date-time" },
            endedAt: { type: "string", format: "date-time", description: "Not in the future" },
            durationSec: { type: "number", minimum: 0, description: "Time walked, without pauses" },
            distanceM: { type: "number", minimum: 0, maximum: 200000 },
            path: {
              type: "array",
              description: "One list of points per stretch between pauses; stored with at most 500 points",
              items: { type: "array", items: { $ref: "#/components/schemas/Coordinates" } },
            },
          },
        },
        WalkSummary: {
          type: "object",
          properties: {
            _id: { type: "string" },
            routeId: { type: "string", nullable: true },
            groupWalkId: { type: "string", nullable: true },
            name: { type: "string", nullable: true, description: "The route's or group walk's name when saved" },
            startedAt: { type: "string", format: "date-time" },
            endedAt: { type: "string", format: "date-time" },
            durationSec: { type: "number" },
            distanceM: { type: "number" },
          },
        },
        Walk: {
          allOf: [
            { $ref: "#/components/schemas/WalkSummary" },
            {
              type: "object",
              properties: {
                path: {
                  type: "array",
                  items: { type: "array", items: { $ref: "#/components/schemas/Coordinates" } },
                },
              },
            },
          ],
        },
        WalkStats: {
          type: "object",
          properties: {
            walkCount: { type: "integer" },
            totalDistanceM: { type: "number" },
            totalDurationSec: { type: "number" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/api/auth/register": {
        post: {
          summary: "Register a new user",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: ref("RegisterRequest"),
                example: { name: "Test User", email: "test@example.com", password: "secret123" },
              },
            },
          },
          responses: {
            201: ok("Registered and logged in", ref("AuthResponse")),
            400: fail("Name, email or password missing or invalid, or the user already exists"),
            429: fail("Too many attempts"),
          },
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Log in and get a token",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: ref("AuthRequest"),
                example: { email: "test@example.com", password: "secret123" },
              },
            },
          },
          responses: {
            200: ok("Logged in", ref("AuthResponse")),
            400: fail("Email or password missing, or invalid credentials"),
            429: fail("Too many attempts"),
          },
        },
      },
      "/api/users/{id}": {
        get: {
          summary: "My profile",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [userIdParam],
          responses: {
            200: ok("The profile", ref("User")),
            403: fail("Not my own id"),
            404: fail("User not found"),
          },
        },
        put: {
          summary: "Update my profile",
          description: "Changing the email requires `currentPassword`.",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [userIdParam],
          requestBody: { required: true, content: json(ref("UpdateUserRequest")) },
          responses: {
            200: ok("The updated profile", ref("User")),
            400: fail("Invalid name, email, height or weight, or currentPassword missing for an email change"),
            401: fail("Current password is incorrect"),
            403: fail("Not my own id"),
            404: fail("User not found"),
            409: fail("Email already in use"),
          },
        },
        delete: {
          summary: "Delete my account and my data",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [userIdParam],
          responses: {
            200: ok("Account deleted"),
            403: fail("Not my own id"),
            404: fail("User not found"),
          },
        },
      },
      "/api/users/{id}/change-password": {
        post: {
          summary: "Change my password",
          description: "Logs out every other session; use the returned token from now on.",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [userIdParam],
          requestBody: {
            required: true,
            content: json({
              type: "object",
              required: ["currentPassword", "newPassword"],
              properties: {
                currentPassword: { type: "string" },
                newPassword: { type: "string", minLength: 8 },
              },
            }),
          },
          responses: {
            200: ok("Password changed", { type: "object", properties: { token: { type: "string" } } }),
            400: fail("A password is missing, too short, or the same as before"),
            401: fail("Current password is incorrect"),
            403: fail("Not my own id"),
            404: fail("User not found"),
          },
        },
      },
      // Route endpoints
      "/api/routes/generate": {
        post: {
          summary: "Generate a new walking route",
          description:
            "Generates a circular or point-to-point walking route based on distance and preferences",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: ref("GenerateRouteRequest"),
                example: {
                  startLocation: { latitude: 47.4979, longitude: 19.0402 },
                  distance: 5,
                  routeType: "circular",
                  preferences: { parks: true, waterfront: true, avoidHighways: true, scenic: false },
                },
              },
            },
          },
          responses: {
            201: ok("The generated route (saved for the user)", ref("Route")),
            400: fail("Invalid route type, coordinates or distance (0.5-50 km)"),
            401: fail("Missing or invalid token"),
            429: fail("Too many routes generated; try again later"),
            500: fail("The routing services failed"),
          },
        },
      },
      "/api/routes": {
        get: {
          summary: "My routes, newest first",
          description: "Without coordinates; load one route for its map. Pages by creation time.",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "before", schema: { type: "string", format: "date-time" }, description: "Only routes before this (the oldest one loaded)" },
            { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
          ],
          responses: {
            200: ok("A page of my routes (without coordinates)", { type: "array", items: ref("Route") }),
            400: fail("Invalid before or limit"),
          },
        },
      },
      "/api/routes/user/{userId}": {
        get: {
          summary: "My routes (old path)",
          description: "Same as GET /api/routes; the userId is ignored. Kept for older app versions.",
          deprecated: true,
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "userId", required: true, schema: { type: "string" } }],
          responses: {
            200: ok("My routes", { type: "array", items: ref("Route") }),
          },
        },
      },
      "/api/routes/favorites/list": {
        get: {
          summary: "My favourite routes, most recently favourited first",
          description: "Without coordinates. Pages by the time they were favourited; 50 at a time by default.",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "before", schema: { type: "string", format: "date-time" }, description: "Only routes favourited before this" },
            { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 50, default: 50 } },
          ],
          responses: {
            200: ok("A page of my favourites (without coordinates)", { type: "array", items: ref("Route") }),
            400: fail("Invalid before or limit"),
          },
        },
      },
      "/api/routes/{routeId}": {
        get: {
          summary: "One of my routes",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [routeIdParam],
          responses: {
            200: ok("The route", ref("Route")),
            404: fail("Route not found"),
          },
        },
        delete: {
          summary: "Delete one of my routes",
          description: "Walks saved on it stay in the walk history.",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [routeIdParam],
          responses: {
            200: ok("Route deleted"),
            404: fail("Route not found"),
          },
        },
      },
      "/api/routes/{routeId}/favorite": {
        post: {
          summary: "Add a route to my favourites",
          description: "Unnamed routes get a name like \"Circular 5.2km\" unless one is given.",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [routeIdParam],
          requestBody: { content: json({ type: "object", properties: { name: { type: "string" } } }) },
          responses: {
            200: ok("The route, now a favourite", ref("Route")),
            404: fail("Route not found"),
          },
        },
        delete: {
          summary: "Remove a route from my favourites",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [routeIdParam],
          responses: {
            200: ok("The route, no longer a favourite", ref("Route")),
            404: fail("Route not found"),
          },
        },
      },
      "/api/routes/{routeId}/name": {
        patch: {
          summary: "Rename one of my routes",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [routeIdParam],
          requestBody: {
            required: true,
            content: json({ type: "object", required: ["name"], properties: { name: { type: "string" } } }),
          },
          responses: {
            200: ok("The renamed route", ref("Route")),
            400: fail("Route name is required"),
            404: fail("Route not found"),
          },
        },
      },
      "/api/routes/{routeId}/complete": {
        post: {
          summary: "Count a walk on one of my routes",
          description: "POST /api/walks does this too when saving a walk with a routeId.",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [routeIdParam],
          responses: {
            200: ok("The new walk count", {
              type: "object",
              properties: {
                walkCount: { type: "integer" },
                lastWalkedAt: { type: "string", format: "date-time" },
              },
            }),
            404: fail("Route not found"),
          },
        },
      },
      "/api/users/search": {
        get: {
          summary: "Search users by name or exact email",
          description:
            "Partial, case-insensitive name match; if the query contains '@' it must match an email exactly. Excludes the logged-in user; at most 20 results.",
          tags: ["Users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "q",
              required: true,
              schema: { type: "string", minLength: 2 },
              description: "Name fragment or full email address",
              example: "ann",
            },
          ],
          responses: {
            200: {
              description: "Matching users",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { type: "array", items: { $ref: "#/components/schemas/UserSearchResult" } },
                    },
                  },
                },
              },
            },
            400: {
              description: "Query shorter than 2 characters",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
          },
        },
      },
      "/api/friends": {
        get: {
          summary: "List my friends",
          tags: ["Friends"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Friends of the logged-in user",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Friend" } } } } } },
            },
          },
        },
      },
      "/api/friends/requests": {
        get: {
          summary: "List pending friend requests",
          description: "Incoming requests are addressed to me; outgoing requests are the ones I sent.",
          tags: ["Friends"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Pending requests",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { incoming: { type: "array", items: { $ref: "#/components/schemas/FriendRequest" } }, outgoing: { type: "array", items: { $ref: "#/components/schemas/FriendRequest" } } } } } } } },
            },
          },
        },
        post: {
          summary: "Send a friend request",
          description:
            "If the other user already sent me a request, it is accepted instead and the response is 200.",
          tags: ["Friends"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object", required: ["userId"], properties: { userId: { type: "string" } } },
                example: { userId: "65a1b2c3d4e5f6789013" },
              },
            },
          },
          responses: {
            201: {
              description: "Friend request sent",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Friendship" }, message: { type: "string" } } } } },
            },
            200: {
              description: "The other user's pending request was accepted",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Friendship" } } } } },
            },
            400: {
              description: "Missing user id, or a request to yourself",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
            409: {
              description: "Already friends, or a request already exists",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
            429: {
              description: "Too many pending outgoing requests (50)",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
          },
        },
      },
      "/api/friends/requests/{id}/accept": {
        post: {
          summary: "Accept a friend request addressed to me",
          tags: ["Friends"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Friend request id" },
          ],
          responses: {
            200: {
              description: "Friend request accepted",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Friendship" } } } } },
            },
            404: {
              description: "Friend request not found",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
          },
        },
      },
      "/api/friends/requests/{id}/decline": {
        post: {
          summary: "Decline a friend request addressed to me",
          tags: ["Friends"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Friend request id" },
          ],
          responses: {
            200: {
              description: "Friend request declined",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } },
            },
            404: {
              description: "Friend request not found",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
          },
        },
      },
      "/api/friends/requests/{id}": {
        delete: {
          summary: "Cancel a friend request I sent",
          tags: ["Friends"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Friend request id" },
          ],
          responses: {
            200: {
              description: "Friend request cancelled",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } },
            },
            404: {
              description: "Friend request not found",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
          },
        },
      },
      "/api/friends/{userId}": {
        delete: {
          summary: "Unfriend a user",
          tags: ["Friends"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "userId", required: true, schema: { type: "string" }, description: "The friend's user id" },
          ],
          responses: {
            200: {
              description: "Friend removed",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } },
            },
            404: {
              description: "Not friends with this user",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
              },
            },
          },
        },
      },
      "/api/group-walks": {
        post: {
          summary: "Plan a group walk from one of my routes",
          description:
            "Copies the route into the walk and invites friends. I am added as the organiser with status accepted.",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateGroupWalkRequest" },
                example: {
                  routeId: "65a1b2c3d4e5f6789013",
                  scheduledAt: "2030-05-03T08:00:00.000Z",
                  title: "Sunday walk",
                  inviteeIds: ["65a1b2c3d4e5f6789014"],
                },
              },
            },
          },
          responses: {
            201: {
              description: "Group walk created",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/GroupWalkDetail" } } },
                },
              },
            },
            400: {
              description: "Time not in the future, title/note too long, more than 20 participants, or invitees who aren't friends (listed in invalidIds)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Route not found among my routes",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
        get: {
          summary: "List my group walks",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "scope",
              schema: { type: "string", enum: ["invitations", "upcoming", "past"], default: "upcoming" },
              description:
                "invitations: still ahead, not cancelled, awaiting my answer; upcoming: still ahead and accepted by me (cancelled ones included); past: time has passed, newest first",
            },
          ],
          responses: {
            200: {
              description: "Walks in the scope",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/GroupWalkSummary" } } } },
                },
              },
            },
            400: {
              description: "Unknown scope",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/group-walks/summary": {
        get: {
          summary: "Counts for the Social badge",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Pending friend requests and walk invitations",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { $ref: "#/components/schemas/SocialSummary" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/group-walks/{id}": {
        get: {
          summary: "Get a group walk with its route, participants and my status",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
          ],
          responses: {
            200: {
              description: "The group walk",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/GroupWalkDetail" } } },
                },
              },
            },
            404: {
              description: "Walk not found, or I'm not part of it",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
        patch: {
          summary: "Change the title, note or time (organiser)",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string", maxLength: 80 },
                    note: { type: "string", maxLength: 500 },
                    scheduledAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Updated walk",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/GroupWalkDetail" } } },
                },
              },
            },
            400: {
              description: "The walk is cancelled or has already happened",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            403: {
              description: "Only the organiser can do this",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Walk not found, or I'm not part of it",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/group-walks/{id}/cancel": {
        post: {
          summary: "Cancel the walk (organiser)",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
          ],
          responses: {
            200: {
              description: "Cancelled walk",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/GroupWalkDetail" } } },
                },
              },
            },
            400: {
              description: "The walk is cancelled or has already happened",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            403: {
              description: "Only the organiser can do this",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Walk not found, or I'm not part of it",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/group-walks/{id}/invites": {
        post: {
          summary: "Invite more friends (organiser)",
          description: "People who declined are invited again; people already invited or coming are left as they are.",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userIds"],
                  properties: { userIds: { type: "array", items: { type: "string" } } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Updated walk",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/GroupWalkDetail" } } },
                },
              },
            },
            400: {
              description: "Empty list, walk closed, more than 20 participants, or users who aren't friends (listed in invalidIds)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            403: {
              description: "Only the organiser can do this",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Walk not found, or I'm not part of it",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/group-walks/{id}/participants/{userId}": {
        delete: {
          summary: "Remove a participant (organiser)",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
            { in: "path", name: "userId", required: true, schema: { type: "string" }, description: "Participant's user id" },
          ],
          responses: {
            200: {
              description: "Updated walk",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/GroupWalkDetail" } } },
                },
              },
            },
            400: {
              description: "The organiser can't be removed",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            403: {
              description: "Only the organiser can do this",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Walk or participant not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/group-walks/{id}/respond": {
        post: {
          summary: "Accept or decline an invitation",
          description: "The answer can be changed until the walk starts; declining after accepting is how to leave.",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string", enum: ["accepted", "declined"] } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "My new status",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { myStatus: { type: "string" } } } } },
                },
              },
            },
            400: {
              description: "Unknown answer, organiser responding, or the walk is cancelled or has already happened",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Walk not found, or I'm not part of it",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/group-walks/{id}/comments": {
        get: {
          summary: "List comments, newest first",
          description:
            "Any participant can read, including those who declined. Pass the oldest loaded comment's createdAt as before to load older ones.",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
            {
              in: "query",
              name: "before",
              schema: { type: "string", format: "date-time" },
              description: "Only comments created before this time",
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responses: {
            200: {
              description: "Comments",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { type: "array", items: { $ref: "#/components/schemas/GroupWalkComment" } },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid before date or limit",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Walk not found, or I'm not part of it",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
        post: {
          summary: "Add a comment",
          description:
            "Participants who haven't declined can comment, also after the walk; not on cancelled walks.",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["text"],
                  properties: { text: { type: "string", minLength: 1, maxLength: 500 } },
                },
                example: { text: "See you at the bridge" },
              },
            },
          },
          responses: {
            201: {
              description: "Comment added",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/GroupWalkComment" } } },
                },
              },
            },
            400: {
              description: "Empty or too long text, or the walk is cancelled",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            403: {
              description: "I declined this walk",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Walk not found, or I'm not part of it",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/group-walks/{id}/comments/{commentId}": {
        delete: {
          summary: "Delete a comment (its author or the organiser)",
          tags: ["Group Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" }, description: "Group walk id" },
            { in: "path", name: "commentId", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: ok("Comment deleted"),
            403: {
              description: "Only the author or the organiser can delete this comment",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            404: {
              description: "Walk or comment not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/walks": {
        post: {
          summary: "Save a finished walk",
          tags: ["Walks"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RecordWalkRequest" } } },
          },
          responses: {
            201: {
              description: "The saved walk",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Walk" } },
                  },
                },
              },
            },
            400: { description: "Invalid times, duration, distance or path", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Route or group walk not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        get: {
          summary: "My walks, newest first (without paths)",
          tags: ["Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "before", schema: { type: "string", format: "date-time" }, description: "Only walks started before this (the oldest one loaded)" },
            { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
          ],
          responses: {
            200: {
              description: "A page of walks",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { type: "array", items: { $ref: "#/components/schemas/WalkSummary" } },
                    },
                  },
                },
              },
            },
            400: { description: "Invalid before or limit", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/walks/stats": {
        get: {
          summary: "Totals of my walks in a time range",
          tags: ["Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "from", schema: { type: "string", format: "date-time" }, description: "Walks started at or after this" },
            { in: "query", name: "to", schema: { type: "string", format: "date-time" }, description: "Walks started before this" },
          ],
          responses: {
            200: {
              description: "Walk count, distance and time",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/WalkStats" } },
                  },
                },
              },
            },
            400: { description: "Invalid from or to", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/walks/{id}": {
        get: {
          summary: "One of my walks, with its path",
          tags: ["Walks"],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "The walk",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Walk" } },
                  },
                },
              },
            },
            404: { description: "Walk not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
    },
  },

  apis: [],
});

export default swaggerSpec;
