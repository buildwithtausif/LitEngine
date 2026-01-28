import express, { Router } from "express";
import inventoryController from "../controllers/inventory.ctrl.js";
import { asyncHandler } from "../utils/errorHandler.js";
import apiLimiter from "../middleware/rateLimiter.mjs";

const inventory_router: Router = express.Router();
const inventory = new inventoryController();

inventory_router
  .route("/")
  .get(asyncHandler(inventory.readFromInventory))
  .post(apiLimiter, asyncHandler(inventory.pushToInventory))
  .delete(apiLimiter, asyncHandler(inventory.deleteInventory));

export default inventory_router;
