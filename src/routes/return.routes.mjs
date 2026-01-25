import express from "express";
import { returnBooks } from "../controllers/return.ctrl.mjs";
const return_router = express.Router();

import { asyncHandler } from "../utils/errorHandler.js";

return_router.route("/").patch(asyncHandler(returnBooks));

export default return_router;
