import express from "express";
import { borrowBooks } from "../controllers/borrow.ctrl.mjs";
const borrow_router = express.Router();

import { asyncHandler } from "../utils/errorHandler.js";
import apiLimiter from "../middleware/rateLimiter.mjs";

borrow_router.route("/").post(apiLimiter, asyncHandler(borrowBooks));

export default borrow_router;
