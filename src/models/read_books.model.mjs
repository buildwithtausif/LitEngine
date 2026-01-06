import db from "./db.js";

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
      b.updated_at
    FROM 
      library.books b
  `;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  // Safely iterate over criteria properties.
  Object.keys(criteria).forEach(key => {
    const value = criteria[key];
    if (['title', 'author', 'genre', 'publisher'].includes(key)) {
      conditions.push(`b.${key} ILIKE $${paramIndex++}`);
      values.push(`%${value}%`);
    } else if (['_id', 'isbn'].includes(key)) {
      conditions.push(`b.${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
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