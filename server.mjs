import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
import user_router from "./src/routes/user.routes.mjs";
import book_router from "./src/routes/book.routes.mjs";
import borrow_router from "./src/routes/borrow.routes.mjs";
import return_router from "./src/routes/return.routes.mjs";
import inventory_router from "./src/routes/inventory.routes";
// create an express-server
const server = express();
// enabling all cors for demo purposes
server.use(cors());
// the middleware issue :'( earlier I've not included it coz, was not getting it but now ik
server.use(express.json()); // to handle json request body as express does not parse json out-of-the box we need to explicitly define it to handle such requests
// Port configuration - use environment variable or fallback
const port = process.env.PORT || 8000;

// Redirect root to dashboard
// server.get("/", (req, res) => {
//   res.redirect("/dashboard");
// });

// Serve static files from the 'public' directory
// server.use(express.static(path.join(__dirname, "public")));

// SPA Fallback for Dashboard
// server.use(
//   "/dashboard",
//   express.static(path.join(__dirname, "public/dashboard"))
// );

// Handle all distinct dashboard routes (SPA fallback)
// Handle all distinct dashboard routes (SPA fallback)

// Using server.use to match paths safely without Express 5 strict wildcard syntax issues
// server.use("/dashboard", (req, res, next) => {
//   // Pass through if the request was handled by static files (though static usually handles this before)
//   // For SPA, we want to serve index.html for any GET request that falls through here
//   if (req.method === "GET") {
//     res.sendFile(path.join(__dirname, "public/dashboard", "index.html"));
//   } else {
//     next();
//   }
// });

// routes definition is listed here
server.use("/api/users", user_router);
server.use("/api/books", book_router);
server.use("/api/borrow", borrow_router);
server.use("/api/return", return_router);
server.use("/api/inventory", inventory_router);

// Global error handler
server.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// start the server - bind to 0.0.0.0 for deployment compatibility
server.listen(port, "0.0.0.0", () => {
  console.log(`express-server is running at host:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
