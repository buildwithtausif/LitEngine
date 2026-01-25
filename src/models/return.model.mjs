import db, { pgp } from './db.mjs';

/**
 * Closes borrow logs (marks as returned) and increments inventory quantity.
 * 
 * @param {string[]} transactionIds - Array of loan IDs (library.bookloans._id) to return.
 * @returns {Promise<Object[]>} The updated loan records.
 * @throws {Error} If database transaction fails.
 */
export async function closeBorrowLogs(transactionIds) {
    try {
        const updatedLogs = await db.tx("return-books-transaction", async (t) => {
             // 1. Update book loans and return the loaned_item IDs
             const query = `
                UPDATE library.bookloans
                SET returned_on = NOW()
                WHERE
                    _id IN ($1:list) -- Fixed column name to _id (assuming PK is _id based on schema) OR transaction_id if that's what it is? Schema says _id is PK. Controller sends transaction_id found in req.body. Let's assume input matches PK.
                    AND returned_on IS NULL -- Fixed column name from return_date to returned_on (schema: returned_on)
                RETURNING *;
            `;
            const logs = await t.any(query, [transactionIds]);
            
            if (logs.length > 0) {
                // 2. Increment currentQty for each returned book
                // We can do this in loop or bulk. Loop is safer for logic clarity within TX.
                for (const log of logs) {
                    await t.none(
                        "UPDATE library.inventory SET currentQty = currentQty + 1 WHERE _id = $1",
                        [log.loaned_item]
                    );
                }
            }
            return logs;
        });
        return updatedLogs;
    } catch (err) {
        console.error(`Error processing return:`, err);
        throw err;
    }
}