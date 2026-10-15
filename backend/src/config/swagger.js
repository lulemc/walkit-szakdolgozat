import swaggerJSDoc from "swagger-jsdoc";

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
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string" },
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
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
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
                schema: { $ref: "#/components/schemas/AuthRequest" },
                example: { email: "test@example.com", password: "123456" },
              },
            },
          },
          responses: {
            201: {
              description: "User registered successfully",
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Login user and return JWT",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthRequest" },
                example: { email: "test@example.com", password: "123456" },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                  example: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                },
              },
            },
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
                schema: { $ref: "#/components/schemas/GenerateRouteRequest" },
                example: {
                  startLocation: {
                    latitude: 47.4979,
                    longitude: 19.0402,
                  },
                  distance: 5,
                  routeType: "circular",
                  preferences: {
                    parks: true,
                    waterfront: true,
                    avoidHighways: true,
                    scenic: false,
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Route generated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Route generated successfully",
                      },
                      route: { $ref: "#/components/schemas/Route" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid request data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Distance must be greater than 0",
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing token",
            },
          },
        },
      },
      "/api/routes/user/{userId}": {
        get: {
          summary: "Get all routes for a user",
          description: "Retrieves all saved routes for the specified user",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "userId",
              required: true,
              schema: { type: "string" },
              description: "User ID",
              example: "65a1b2c3d4e5f6789013",
            },
          ],
          responses: {
            200: {
              description: "Routes retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Routes retrieved successfully",
                      },
                      count: { type: "number", example: 5 },
                      routes: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Route" },
                      },
                    },
                  },
                },
              },
            },
            403: {
              description: "Forbidden - Cannot access other user's routes",
            },
          },
        },
      },
      "/api/routes/{routeId}": {
        get: {
          summary: "Get a single route by ID",
          description: "Retrieves detailed information about a specific route",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "routeId",
              required: true,
              schema: { type: "string" },
              description: "Route ID",
              example: "65a1b2c3d4e5f6789012",
            },
          ],
          responses: {
            200: {
              description: "Route retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Route retrieved successfully",
                      },
                      route: { $ref: "#/components/schemas/Route" },
                    },
                  },
                },
              },
            },
            404: {
              description: "Route not found",
            },
          },
        },
        delete: {
          summary: "Delete a route",
          description: "Permanently deletes a route from the database",
          tags: ["Routes"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "routeId",
              required: true,
              schema: { type: "string" },
              description: "Route ID",
              example: "65a1b2c3d4e5f6789012",
            },
          ],
          responses: {
            200: {
              description: "Route deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Route deleted successfully",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Route not found",
            },
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
    },
  },

  apis: [],
});

export default swaggerSpec;
