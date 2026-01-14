import db from "./db.mjs";

/**
 * Finds books, calculates borrowed/available counts, and aggregates active loan details into a nested JSON array.
 * @param {object} criteria - An object containing filter criteria.
 * @returns {Promise<Array>} - An array of unique book objects with their loan counts and a nested array of loans.
 */
export default async function find_books(criteria = {}) {
  let query = `
    SELECT 
      b._id, 
      b.title, 
      b.author, 
      b.publisher, 
      b.genre, 
      b.isbn,
      b.created_at,
      b.updated_at,
      COALESCE(
        json_agg(
            json_build_object(
                'transaction_id', t._id,
                'user_name', u.name,
                'borrowed_by', u._id,
                'due_date', t.due_by
            ) 
        ) FILTER (WHERE t._id IS NOT NULL), 
        '[]'
      ) as loans
    FROM 
      library.books b
    LEFT JOIN library.inventory inv ON inv.bookid = b._id
    LEFT JOIN library.bookloans t ON t.loaned_item = inv._id AND t.returned_on IS NULL
    LEFT JOIN library.users u ON t.loaned_to = u._id
  `;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  // Safely iterate over criteria properties.
  Object.keys(criteria).forEach((key) => {
    const value = criteria[key];
    if (["title", "author", "genre", "publisher"].includes(key)) {
      conditions.push(`b.${key} ILIKE $${paramIndex++}`);
      values.push(`%${value}%`);
    } else if (["_id", "id", "isbn"].includes(key)) {
      // Map 'id' to '_id' column
      const dbColumn = key === "id" ? "_id" : key;
      conditions.push(`b.${dbColumn} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += " GROUP BY b._id";

  // Filter for borrowed status locally via HAVING or just return structure and let frontend filter?
  // Frontend requests /books?status=borrowed
  if (criteria.status === "borrowed") {
    query += ` HAVING COUNT(t._id) > 0`;
  }

  query += " ORDER BY b.title ASC;";

  try {
    const books = await db.any(query, values);
    return books;
  } catch (err) {
    console.error("Error executing find_books query:", err);
    throw new Error(err);
  }
}
