import express, { Router } from "express";
import inventoryController from "../controllers/inventory.ctrl.js";
import { asyncHandler } from "../utils/errorHandler.js";

const inventory_router: Router = express.Router();
const inventory = new inventoryController();

inventory_router
  .route("/")
  .get(asyncHandler(inventory.readFromInventory))
  .post(asyncHandler(inventory.pushToInventory))
  .delete(asyncHandler(inventory.deleteInventory));

export default inventory_router;
