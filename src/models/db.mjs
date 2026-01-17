import pgPromise from "pg-promise";
import dotenv from 'dotenv';
//import dotenv
dotenv.config();
// import db credentials from env
const db_host = process.env.PSQL_HOST || 'localhost';
const db_port = process.env.PSQL_PORT || '5600';
const db_user = process.env.PSQL_USER;
const db_pass = process.env.PSQL_PASS;
const db_name = process.env.PSQL_DB;
const connectionQuery = `postgres://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`;
// const connectionQuery = `postgres://${db_user}:${db_pass}@localhost:5600/${db_name}`;
// init pg-promise and estabilish connection
const pgp = pgPromise({
    capSQL: true // to capitalize generated SQL
});
const db = pgp(connectionQuery);

(async () => {
    try {
        const obj = await db.connect();
        console.log(`db connected: ${obj.client.database}`);
        obj.done();
    } catch (err) {
        console.log(err);
    }
})();

// export both as named exports, and db by default
export { pgp, db };
export default db;