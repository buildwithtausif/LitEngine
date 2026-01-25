import express from "express";
import { getbooks, addbooks, update_books } from "../controllers/book.ctrl.mjs";
const book_router = express.Router();

import { asyncHandler } from "../utils/errorHandler.js";

book_router.route("/").get(asyncHandler(getbooks)).post(asyncHandler(addbooks));

book_router.route("/").patch(asyncHandler(update_books));

export default book_router;
