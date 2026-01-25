import express from "express";
import { borrowBooks } from "../controllers/borrow.ctrl.mjs";
const borrow_router = express.Router();

import { asyncHandler } from "../utils/errorHandler.js";

borrow_router.route("/").post(asyncHandler(borrowBooks));

export default borrow_router;
