import request from "supertest";
import app from "../../app"; // your Express app
import User from "../../models/User";
import { describe, it, expect, beforeEach } from "vitest";

describe("POST /api/users/register", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should register user and return token", async () => {
    const res = await request(app).post("/api/users/register").send({
      name: "Luca",
      email: "luca@test.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("luca@test.com");
    expect(res.body.token).toBeDefined();
  });

  it("should fail if email already exists", async () => {
    await request(app).post("/api/users/register").send({
      name: "Luca",
      email: "luca@test.com",
      password: "password123",
    });

    const res = await request(app).post("/api/users/register").send({
      name: "Luca",
      email: "luca@test.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
  });
});
