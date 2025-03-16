import { Hono } from "hono";
import { cors } from "hono/cors";
import userRouter from "./user.routes";
import milestoneRouter from "./milestone.routes";
import walletRouter from "./wallet.routes";
import transactionRouter from "./transaction.routes";
import tokenRouter from "./token.routes";
import roleRouter from "./role.routes";

const api = new Hono();

// Apply CORS middleware
api.use("/*", cors({
  origin: "*",
  allowHeaders: ["Authorization", "Content-Type"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 86400,
}));

// API version
const v1 = new Hono();

// API routes
v1.route("/users", userRouter);
v1.route("/milestones", milestoneRouter);
v1.route("/wallets", walletRouter);
v1.route("/transactions", transactionRouter);
v1.route("/tokens", tokenRouter);
v1.route("/roles", roleRouter);

// Mount API version
api.route("/api/v1", v1);

// Add error handling middleware
api.onError((err: Error, c: import('hono').Context) => {
  console.error('API error:', err);
  return c.json({
    success: false,
    message: 'An error occurred while processing your request',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  }, 500);
});

// Root route
api.get("/", (c) => c.json({ message: "Welcome to Stashflow API", version: "1.0.0" }));

export default api;
