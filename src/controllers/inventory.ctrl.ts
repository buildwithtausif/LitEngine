import recordExist from "../utils/dbUtils.model.mjs";
import { generateUuid } from "../service/id_service.mjs";
import inventoryModel from "../models/inventory.model.js";
import getErrorMessage from "../utils/errorHandler.js";
import type { Request, Response } from "express";
export default class inventoryController {

  // reading data from inventory
  async readInventory(req: Request, res: Response) {
    try {
      // to handle query like : /api/inventory?id=UUID
      const { id } = req.query;
      if (id) {
        if (typeof id !== "string") {
          return res.status(404).json({ Error: "Invalid ID provided" });
        }
        let inventoryHandler = new inventoryModel(id);
        const inventoryData = await inventoryHandler.readEntries();
        return inventoryData
          ? res.status(200).json(inventoryData)
          : res
              .status(404)
              .json({
                Message: `No associated data with provided id: ${id} found!`,
              });
      }
      // if no id is provided then return the whole data
      let inventoryHandler = new inventoryModel();
      const inventoryData = await inventoryHandler.readEntries();
      return inventoryData
        ? res.status(200).json(inventoryData)
        : res.status(404).json({ Message: "Inventory is currently empty" });
    } catch (error) {
      let message = getErrorMessage(error);
      return res.status(500).json({ Error: message });
    }
  }
  // creating inventory entries 
  // mandate bookid 
  
}
