import pgPromise from "pg-promise";
import dotenv from "dotenv";
import getErrorMessage from "../utils/errorHandler.ts";
//import dotenv
dotenv.config();
// import db credentials from env
const db_host = process.env.PSQL_HOST;
const db_port = process.env.PSQL_PORT;
const db_user = process.env.PSQL_USER;
const db_pass = process.env.PSQL_PASS;
const db_name = process.env.PSQL_DB;
const initOptions = {
  capSQL: true, // to capitalize generated SQL
  // Global event notification;
  error(err, e) {
    if (e.cn) {
      // A connection-related error;
      console.log("CN:", e.cn);
      console.log("EVENT:", err.message || err);
    }
  },
  connect(client, dc, useCount) {
    const cp = client.connectionParameters;
    console.log(
      "Connected to database:",
      cp?.database || client.database || db_name,
    );
  },
};

// init pg-promise and estabilish connection
const pgp = pgPromise(initOptions);

const dbConfig = {
  host: db_host,
  port: db_port,
  database: db_name,
  user: db_user,
  password: db_pass,
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 200000, // return an error after 2 seconds if connection could not be established
};
const db = pgp(dbConfig);

(async () => {
  try {
    const obj = await db.connect();
    console.log(`db connected: ${obj.client.database}`);
    obj.done();
  } catch (err) {
    console.log(getErrorMessage(err));
  }
})();

// export both as named exports, and db by default
export { pgp, db };
export default db;
