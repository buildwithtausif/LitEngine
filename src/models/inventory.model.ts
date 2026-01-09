import db from "./db.mjs";
import recordExist from "../utils/dbUtils.model.mjs";
import getErrorMessage from "../utils/errorHandler.js";

interface Inventory {
    _id: string;
    bookid: string;
    totalqty: number;
    currentqty: number;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
class inventoryHandler {
    constructor (public bookid:string, public totalqty: number) {}
    // POST: Insert new data into the inventory
    async createEntry(): Promise<Inventory> {
        let query:string = `
            INSERT INTO library.inventory (bookid, totalqty)
            VALUES ($1, $2)
            RETURNING *;
        `;
        try {
            // need to check if the provided bookID actually exists in the global book-table
            // if it's not stop and suggest to first import book details in the global database
            let recordFound: boolean = await recordExist({
                "scheme": "library",
                "table": "books",
                "colName": "_id",
                "value": this.bookid,
            });
            if (!recordFound) {
                throw getErrorMessage(`Invalid BookID: The book ${this.bookid} is not available in the global database!`);
            }
            // if book is available in the global database build query and add that to database
            const inventory = await db.one(query, [this.bookid, this.totalqty]);
            return inventory;
        } catch (error) {
            throw getErrorMessage(error);
        }

    }
}