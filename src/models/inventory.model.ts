import db, { pgp } from "./db.mjs";
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
    public totalqty?: number,
    public currentqty?: number
  ) {}

  /**
   * insert new data into the inventory
   * @returns {Promise<Inventory>} The created inventory record.
   */
  async createEntry(): Promise<Inventory> {
    // if the model receives an id explicitly then pass as is and if not... generate a new one
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
      const recordFound: boolean = await recordExist({
        schema: "library",
        tableName: "books",
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

  /**
   * Bulk inserts multiple inventory items.
   * Validates all book IDs before insertion. Rejects the entire batch if any ID is invalid.
   * 
   * @param {Array<{bookid: UUID, totalqty: number}>} items - Array of inventory items to create.
   * @returns {Promise<Inventory[]>} Array of created inventory records.
   * @throws {Error} If any book ID is invalid.
   */
  async bulkCreateEntries(
    items: { bookid: UUID; totalqty: number }[]
  ): Promise<Inventory[]> {
    try {
      // 1. extract all bookids to check existence
      const allBookIds = items.map((i) => i.bookid);

      // 2. Validate IDs using bulk recordExist
      // Returns array of found records like [{_id: 'uuid1'}, {_id: 'uuid2'}]
      const existingBooks = (await recordExist({
        schema: "library",
        tableName: "books",
        colName: "_id",
        value: allBookIds,
        returnRow: true,
      })) as { _id: UUID }[];

      const validBookIds = new Set(existingBooks.map((b) => b._id));

      // 3. Filter valid items and identify invalid ones
      const validItems: any[] = [];
      const invalidIds: UUID[] = [];

      items.forEach((item) => {
        if (validBookIds.has(item.bookid)) {
          // Prepare item for insertion: generate _id, set currentqty default
          validItems.push({
            _id: generateUuid(),
            bookid: item.bookid,
            totalqty: item.totalqty,
            currentqty: item.totalqty, // Default to totalqty
          });
        } else {
          invalidIds.push(item.bookid);
        }
      });

      // 4. If any invalid IDs, reject the whole batch (Strict Consistency)
      if (invalidIds.length > 0) {
        throw getErrorMessage(
          `Bulk Import Failed: The following Book IDs are invalid: ${invalidIds.join(
            ", "
          )}`
        );
      }

      if (validItems.length === 0) return [];

      // 5. Bulk Insert
      // Define column set is recommended for performance, but simple array works if keys match table cols
      // Table cols: _id, bookid, totalqty, currentqty
      const cs = new pgp.helpers.ColumnSet(
        ["_id", "bookid", "totalqty", "currentqty"],
        { table: { schema: "library", table: "inventory" } }
      );

      const query =
        pgp.helpers.insert(validItems, cs) + " RETURNING *";

      const result: Inventory[] = await db.any(query);
      return result;
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
      const entries: Inventory[] = await db.any(query, [_id]);
      return entries;
    } catch (error: unknown) {
      throw getErrorMessage(error);
    }
  }

  // SOFT DELETE: delete inventory data
  /**
   * Soft deletes inventory items.
   * @param {UUID[]} [ids] - Optional array of IDs to delete. If not provided, deletes the instance's _id.
   * @returns {Promise<Inventory[]>} The deleted inventory records.
   */
  async deleteEntries(ids?: UUID[]): Promise<Inventory[]> {
     const targets = ids && ids.length > 0 ? ids : (this._id ? [this._id] : []);
     
     if (targets.length === 0) return [];

     // Use IN operator for bulk update
    let query: string = `
            UPDATE library.inventory
            SET deleted_at = NOW()
            WHERE _id IN ($1:list)
            RETURNING *;
        `;
    try {
      const deleted_entries: Inventory[] = await db.any(query, [targets]);
      return deleted_entries;
    } catch (error) {
      throw getErrorMessage(error);
    }
  }
}
