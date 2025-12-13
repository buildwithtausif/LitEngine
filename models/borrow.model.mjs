/*
    checkDueOrOverdue -- Gets a user's borrowed and overdue books.
    getBorrowedCountForBook -- Counts checked-out copies of a single book.
    borrowTransaction -- Inserts new borrow logs in a safe transaction.

*/
import db, { pgp } from "./db.mjs";
/**
 * checks for any due or overdue directly in the database
 * @param {string} public_id - receives user id from the borrow controller
 * @returns {Promise<Object>}
 */
export async function checkDueOrOverdue(public_id) {
  /* 
        Overdue: returned = null && dueDate < now()
        AllDue: returned = null
    */
  let allDuesQuery = `
        SELECT * FROM borrow_logs WHERE user_id = $1 AND return_date IS NULL
   `;
  let overdueQuery = `
        SELECT * FROM borrow_logs WHERE user_id = $1 AND return_date IS NULL AND due_date < NOW()
   `;

  try {
    const { alldues, overdue } = await db.task("get-due-status", async (t) => {
      const alldues = await t.any(allDuesQuery, [public_id]);
      const overdue = await t.any(overdueQuery, [public_id]);
      return { alldues, overdue };
    });

    return { alldues, overdue };
  } catch (err) {
    console.error(`Error checking dues for user ${public_id}:`, err);
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
    SELECT COUNT(*) FROM borrow_logs WHERE book_id = $1 AND return_date IS NULL
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
 * Gets this stream of object when the controller verifies any fallacy on borrow transaction of books
 * @typedef {Object} borrowReqStruct
 * @property {string} transaction_id - The unique ID for a borrow transaction
 * @property {string} public_id - The unique ID of the borrower registered in the library
 * @property {string} book_id - The unique ID of the book which is in the library
 * @property {Date} borrowDate - Gets the date of transaction (new Date)
 * @property {Date} dueDate - Sets the Due date of the book w.r.t borrowDate + 14 in total 15 Days
 */
/**
 * @param {borrowReqStruct} newBorrowings - A borrow request stream from borrow.ctrl.mjs with borrowReqStruct
 * @returns {Promise<Object>}
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
                       The check if (borrowedCount >= bookDetails.quantity) (i.e., 0 >= 1) is false. Alice's request is approved to proceed.

                       similarly it returns 1 for bob as well as alice's transaction is not completed yet and Bob also gets approval for book availability
        */
      // in that case check the availability inside transaction as well
      for (const borrow of newBorrowings) {
        // gets the total quantity and the title of the book associated with its uuid
        const bookDetails = await t.one(
          "SELECT title, quantity FROM books WHERE uuid = $1",
          [borrow.book_id]
        );
        // getting the count of all books which are issued with this book id and is not yet returned
        const { count } = await t.one(
          "SELECT COUNT(*) FROM borrow_logs WHERE book_id = $1 AND return_date IS NULL",
          [borrow.book_id]
        );
        // using unary-plus to convert count "a string" into a number then comparing
        if (+count >= bookDetails.quantity) {
          throw new Error(
            `Conflict: All copies of '${bookDetails.title}' are currently borrowed.`
          );
        }
      }
      // if all availability checks are passed
      const columns = new pgp.helpers.ColumnSet(
        ["transaction_id", "user_id", "book_id", "borrow_date", "due_date"],
        { table: "borrow_logs" }
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
