import { User } from "@/models/User";
import api from "./api";

const UserService = {
  // GET all users
  getAll: async () => {
    const response = await api.get("/users");
    return response.data;
  },

  // GET user by ID
  getById: async (id:string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // CREATE user
  create: async (userData:User) => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  // UPDATE user
  update: async (id:string, updatedData:User) => {
    const response = await api.put(`/users/${id}`, updatedData);
    return response.data;
  },

  // DELETE user
  delete: async (id:string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default UserService;
