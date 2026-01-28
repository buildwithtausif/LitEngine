import express from "express";
import {
  getusers,
  reg_newuser,
  update_user,
  delete_user,
} from "../controllers/users.ctrl.mjs";
// pre-fix all routes with /api/{given_endpoint}
const user_router = express.Router();

import { asyncHandler } from "../utils/errorHandler.js";
import apiLimiter from "../middleware/rateLimiter.mjs";

user_router
  .route("/")
  .get(asyncHandler(getusers))
  .post(apiLimiter, asyncHandler(reg_newuser));

user_router
  .route("/:user_id")
  .patch(apiLimiter, asyncHandler(update_user))
  .delete(apiLimiter, asyncHandler(delete_user));

export default user_router;
