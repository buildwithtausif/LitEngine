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

user_router
  .route("/")
  .get(asyncHandler(getusers))
  .post(asyncHandler(reg_newuser));

user_router
  .route("/:user_id")
  .patch(asyncHandler(update_user))
  .delete(asyncHandler(delete_user));

export default user_router;
