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
        // NEW: Route schemas
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
            // NEW elevation fields
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
      // NEW: Route endpoints
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
    },
  },

  apis: [],
});

export default swaggerSpec;
