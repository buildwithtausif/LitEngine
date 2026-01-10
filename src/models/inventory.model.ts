import db from "./db.mjs";
import recordExist from "../utils/dbUtils.model.mjs";
import getErrorMessage from "../utils/errorHandler.js";
import { generateUuid } from "../service/id_service.mjs";

type UUID = string;
interface Inventory {
  _id: UUID;
  bookid: UUID;
  totalqty: number;
  currentqty: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
export default class inventoryModel {
  constructor(
    public _id?: UUID,
    public bookid?: UUID,
    public totalqty?: number
  ) {}

  // POST: Insert new data into the inventory
  async createEntry(): Promise<Inventory> {
    // if the model receives an id explicily then pass to as is and if not generate a new one
    const newId: UUID = this._id || generateUuid();
    // template query
    let query: string = `
            INSERT INTO library.inventory (_id,bookid, totalqty)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
    try {
      // need to check if the provided bookID actually exists in the global book-table
      // if it's not stop and suggest to first import book details in the global database
      let recordFound: boolean = await recordExist({
        scheme: "library",
        table: "books",
        colName: "_id",
        value: this.bookid,
      });
      if (!recordFound) {
        throw getErrorMessage(
          `Invalid BookID: The book ${this.bookid} is not available in the global database!`
        );
      }
      // if book is available in the global database build query and add that to database
      const inventory: Inventory = await db.one(query, [
        newId,
        this.bookid,
        this.totalqty
      ]);
      return inventory;
    } catch (error: unknown) {
      throw getErrorMessage(error);
    }
  }

  // GET: Read inventory details
  /**
   * readEntries supports
   * 1. Get all inventory data
   * 2. Find a specific data using inventory-id i.e. _id
   * @returns Promise<Inventory>
   */
  async readEntries(): Promise<Inventory[]> {
    let _id = this._id;
    let query: string;
    if (this._id) {
      query = `
                SELECT _id, bookid, totalqty, currentqty, created_at, updated_at, deleted_at
                FROM library.inventory
                WHERE _id = $1 AND deleted_at IS NULL;
            `;
    } else {
      query = `
            SELECT _id, bookid, totalqty, currentqty, created_at, updated_at, deleted_at
            FROM library.inventory
            WHERE deleted_at IS NULL;
        `;
    }
    try {
      const entries: Inventory[] = await db.many(query, [_id]);
      return entries;
    } catch (error: unknown) {
      throw getErrorMessage(error);
    }
  }

  // SOFT DELETE: delete inventory data
  async deleteEntries(): Promise<Inventory[]> {
    let query: string = `
            UPDATE library.inventory
            SET deleted_at = NOW()
            WHERE _id = $1
            RETURNING *;
        `;
    try {
      const deleted_entry: Inventory[] = await db.oneOrNone(query, [this._id]);
      return deleted_entry;
    } catch (error) {
      throw getErrorMessage(error);
    }
  }
}
