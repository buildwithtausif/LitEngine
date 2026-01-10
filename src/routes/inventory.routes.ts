import express, { Router } from "express";
import inventoryController from "../controllers/inventory.ctrl.js";

const inventory_router: Router = express.Router();
const inventory = new inventoryController();

inventory_router.route("/").get(inventory.readInventory)
export default inventory_router;
