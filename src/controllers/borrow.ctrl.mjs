import recordExist from "../utils/dbUtils.model.mjs";
import { generateUuid } from "../service/id_service.mjs";
import {
  checkDueOrOverdue,
  getBorrowedCountForBook,
  borrowTransaction,
} from "../models/borrow.model.mjs";

const borrowBooks = async (req, res) => {
  try {
    // get identifier and book-set (which is to be borrowed)
    // from request body
    const { user_id, books } = req.body;
    if (!user_id || !books || (Array.isArray(books) && books.length === 0)) {
      return res.status(400).json({
        error: "Bad Request: user_id and a non-empty books array are required.",
      });
    }
    // check if the user exist in db
    const userExist = await recordExist({
      schema: "library",
      tableName: "users",
      colName: "_id",
      value: user_id,
      returnRow: true,
    });
    if (!userExist) {
      return res
        .status(404)
        .json({ error: "no user found with the provided id" });
    }
    // Check if user is soft-deleted
    if (userExist.deleted_at) {
      return res
        .status(404)
        .json({ error: "User not found or has been deleted." });
    }
    // RULE A: Check for overdue books first.
    const dues = await checkDueOrOverdue(user_id);
    if (dues.overdue && dues.overdue.length > 0) {
      return res.status(409).json({
        error:
          "Cannot borrow new books. You have overdue items that must be returned first.",
        overdueBooks: dues.overdue,
      });
    }
    // check if books is an array and if not convert it to an array
    const entries = Array.isArray(req.body.books)
      ? req.body.books
      : [req.body.books];
    // check if any book is issued already if it is then how many if 1 then only possible borrows is 2 and if max=3 no borrows
    const currentBorrowsCount = dues.alldues ? dues.alldues.length : 0;
    if (entries.length + currentBorrowsCount >= 3) {
      return res.status(409).json({
        error: `You are trying to borrow ${
          entries.length
        } book(s), but you only have ${
          3 - currentBorrowsCount
        } borrowing slot(s) available.`,
      });
    }
    // books to issue
    const newBorrowings = [];
    // check if all the provided 'UUIDs' of books exist in the db and insert it into newBorrowings
    const borrowDate = new Date();
    const dueDate = new Date();
    // set due date to 14 days after the day of issue that is 15 day
    dueDate.setDate(borrowDate.getDate() + 14);
    for (const entry of entries) {
      const bookDetails = await recordExist({
        schema: "library",
        tableName: "inventory",
        colName: "bookid",
        value: entry.bookid,
        returnRow: true,
      });
      if (!bookDetails) {
        return res
          .status(400)
          .json({
            error: "Invalid bookid provided",
            provided: `${entry.bookid}`,
          });
      }
      // check for book availability
      const borrowedCount = await getBorrowedCountForBook(bookDetails._id);
      if (borrowedCount >= bookDetails.quantity) {
        return res.status(409).json({
          error: `Conflict: All copies of '${bookDetails.title}' are currently borrowed.`,
        });
      }
      // generate transaction scheme
      newBorrowings.push({
        _id: generateUuid(),
        loaned_to: user_id,
        loaned_item: bookDetails._id, // Fixed: Use inventory ID from DB, not undefined entry.uuid
        loaned_at: borrowDate,
        due_by: dueDate,
      });
    }
    // trigger a transaction
    const newTransaction = await borrowTransaction(newBorrowings);
    // return a response if transaction was successfull
    if (newTransaction) {
      // SUCCESS
      return res.status(201).json({
        message: `Books successfully issued to ${userExist.name} (ID: ${userExist._id})`,
        data: newTransaction,
      });
    } else {
      // FAILURE
      console.error("Database transaction failed for user:", userExist._id); // Good for logging
      return res.status(500).json({
        error: "Failed to complete the borrow transaction",
      });
    }
  } catch (err) {
    if (err.message && err.message.includes("Conflict")) {
      return res.status(409).json({ error: err.message });
    }
    console.error("Error in borrowBooks controller:", err);
    return res.status(500).json({
      error: "Something went wrong on our side. Please try again later ",
      type: err,
    });
  }
};

export { borrowBooks };
