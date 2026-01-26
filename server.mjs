import express from "express";
import user_router from "./src/routes/user.routes.mjs";
import book_router from "./src/routes/book.routes.mjs";
import borrow_router from "./src/routes/borrow.routes.mjs";
import return_router from "./src/routes/return.routes.mjs";
import inventory_router from "./src/routes/inventory.routes";
import cors from "cors";
// create an express-server
const server = express();
// the middleware issue :'( earlier I've not included it coz, was not getting it but now ik
server.use(cors()); // to handle cors
server.use(express.json()); // to handle json request body as express does not parse json out-of-the box we need to explicitly define it to handle such requests
const port = process.env.PORT || 8000;

// use a static page to on /
// server.use(express.static("public"));
// routes definition is listed here
server.use("/api/users", user_router);
server.use("/api/books", book_router);
server.use("/api/borrow", borrow_router);
server.use("/api/return", return_router);
server.use("/api/inventory", inventory_router);
// start the server
server.listen(port, "0.0.0.0", () => {
  console.log(`express-server is running at 0.0.0.0:${port}`);
});
