import pgPromise from "pg-promise";
declare const pgp: pgPromise.IMain<{}, import("pg-promise/typescript/pg-subset.js").IClient>;
declare const db: pgPromise.IDatabase<{}, import("pg-promise/typescript/pg-subset.js").IClient>;
export { pgp, db };
export default db;
//# sourceMappingURL=db.d.ts.map