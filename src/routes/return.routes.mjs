import express from "express";
import { returnBooks } from "../controllers/return.ctrl.mjs";
const return_router = express.Router();

import { asyncHandler } from "../utils/errorHandler.js";
import apiLimiter from "../middleware/rateLimiter.mjs";

return_router.route("/").patch(apiLimiter, asyncHandler(returnBooks));

export default return_router;
