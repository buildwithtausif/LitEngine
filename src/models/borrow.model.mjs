/*
    checkDueOrOverdue -- Gets a user's borrowed and overdue books.
    getBorrowedCountForBook -- Counts checked-out copies of a single book.
    borrowTransaction -- Inserts new borrow logs in a safe transaction.

*/
import db, { pgp } from "./db.mjs";
/**
 * checks for any due or overdue directly in the database
 * @param {string} user_id (_id in library.users) - receives user id from the borrow controller
 * @returns {Promise<Object>}
 */
export async function checkDueOrOverdue(user_id) {
  /* 
        Overdue: returned = null && dueDate < now()
        AllDue: returned = null
    */
  let allDuesQuery = `
        SELECT * FROM library.bookloans WHERE loaned_to = $1 AND returned_on IS NULL
   `;
  let overdueQuery = `
        SELECT * FROM library.bookloans WHERE loaned_to = $1 AND returned_on IS NULL AND due_by < NOW()
   `;

  try {
    const { alldues, overdue } = await db.task("get-due-status", async (t) => {
      const alldues = await t.any(allDuesQuery, [user_id]);
      const overdue = await t.any(overdueQuery, [user_id]);
      return { alldues, overdue };
    });

    return { alldues, overdue };
  } catch (err) {
    console.error(`Error checking dues for user ${user_id}:`, err);
    return { alldues: [], overdue: [] };
  }
}
/**
 * draws a comparison between the original amount of this book in the library and the current count after books are borrowed (if any)
 * @param {string} book_uuid - receives book id from the borrow controller
 * @returns {Promise<number>}
 */
export async function getBorrowedCountForBook(book_uuid) {
  /* function-body */
  let query = `
    SELECT COUNT(*) FROM library.bookloans WHERE loaned_item = $1 AND returned_on IS NULL
  `;
  try {
    const count = await db.one(query, [book_uuid], a => +a.count); // +a.count is equivalent of Number(a.count) or ParseInt(a.count,10)
    return count;
  } catch (err) {
    console.error(
      `Error checking borrowed quantities for book ${book_uuid}:`,
      err
    );
    throw err;
  }
}
/**
 * The structure of data as recieved from the borrow-controller
 * @typedef {Object} borrowReqStruct
 * @property {string} transaction_id - The unique ID for a borrow transaction
 * @property {string} user_id - The unique ID of the borrower registered in the library
 * @property {string} loaned_item - The unique ID of the book which is in the library
 * @property {Date} borrowDate - Gets the date of transaction (new Date)
 * @property {Date} dueDate - Sets the Due date of the book w.r.t borrowDate + 14 in total 15 Days
 */
/**
 * Executes a borrow transaction.
 * Checks book availability, creates loan records, and decrements inventory quantity.
 * 
 * @param {borrowReqStruct[]} newBorrowings - Array of borrow request objects.
 * @returns {Promise<Object[]>} The created loan records.
 * @throws {Error} If database transaction fails or conflicts occur (e.g. book unavailable).
 */
export async function borrowTransaction(newBorrowings) {
  /* create transaction */
  try {
    const result = await db.tx("borrow-books-transaction", async (t) => {
      /*
            edge-case: At nearly the same moment, two different users, Alice and Bob, both send a request to borrow it.
                       Bob just a millisecond later,
                       getBorrowedCountForBook('gatsby-uuid'). The function runs its query and correctly returns 0 (since it's not borrowed yet).
                       The controller checks the book's quantity (which is 1).
                       The check if (currentqty >= bookDetails.quantity) (i.e., 0 >= 1) is false. Alice's request is approved to proceed.

                       similarly it returns 1 for bob as well as alice's transaction is not completed yet and Bob also gets approval for book availability
        */
      // in that case check the availability inside transaction as well
      for (const borrow of newBorrowings) {
        // gets the total quantity and its unique id of the book associated with its uuid
        // FIXED: Joined with library.books to get the title, as inventory doesn't have it
        const bookDetails = await t.one(
          `SELECT i.bookid, b.title, i.currentQty 
           FROM library.inventory i
           JOIN library.books b ON i.bookid = b._id
           WHERE i._id = $1`,
          [borrow.loaned_item]
        );
        
        // Check availability using currentQty directly
        // This handles the Concurrency Edge Case (Alice vs Bob) effectively because
        // we are inside a transaction. The SELECT might read old data if isolation level is low,
        // (default Read Committed). But the subsequent UPDATE will lock.
        // Better: We can rely on the UPDATE's returning value or a WHERE clause.
        // Let's keep the user's logic structure but use currentQty.
        
        if (bookDetails.currentqty <= 0) {
           throw new Error(
            `Conflict: All copies of '${bookDetails.title}' are currently borrowed.`
           );
        }
        
        // DECREMENT currentQty
        await t.none(
          "UPDATE library.inventory SET currentQty = currentQty - 1 WHERE _id = $1",
          [borrow.loaned_item]
        );
      }
      // if all availability checks are passed
      const columns = new pgp.helpers.ColumnSet(
        ["_id", "loaned_to", "loaned_item", "loaned_at", "due_by"],
        { table: { schema: "library", table: "bookloans" } }
      );
      const query = pgp.helpers.insert(newBorrowings, columns) + " RETURNING *";
      return t.many(query);
    });
    return result;
  } catch (err) {
    console.error(
      "Database transaction failed for borrowing books:",
      err.message
    );
    throw err;
  }
}
