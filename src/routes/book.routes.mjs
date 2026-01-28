import express from "express";
import { getbooks, addbooks, update_books } from "../controllers/book.ctrl.mjs";
const book_router = express.Router();

import { asyncHandler } from "../utils/errorHandler.js";
import apiLimiter from "../middleware/rateLimiter.mjs";

book_router
  .route("/")
  .get(asyncHandler(getbooks))
  .post(apiLimiter, asyncHandler(addbooks));

book_router.route("/").patch(apiLimiter, asyncHandler(update_books));

export default book_router;
