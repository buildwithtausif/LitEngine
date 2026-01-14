import db, {pgp} from '../models/db.mjs';
// define confilicting data
/* A confilicting data is any data that meatches already existing 
entity in the server on recieving the same from client. */

/*
    idea is to pass table_name and col_name into this function 
    as parameters and the function will check for the recieved_data into server_col
    if found match it will throw a 409 response code of "CONFLICT"
*/

/**
 * Checks if a record exists in the database.
 * Supports checking a single value or an array of values (bulk check).
 * 
 * @param {string} options.schema - Name of the schema in database
 * @param {string} options.tableName - Name of the table in database
 * @param {string} options.colName - Name of the column in database
 * @param {any|any[]} options.value - The value (or array of values) to search for
 * @param {number|string} [options.excludeId] - (Optional) A user_id/uuid to exclude from the search.
 * @param {boolean} [options.returnRow=false] - If true, returns the full row object (or array of objects) instead of a boolean.
 * @returns {Promise<boolean|object|object[]|null>} Returns boolean by default, or the record object(s)/null if returnRow is true.
 */

export default async function recordExist({schema, tableName, colName, value, excludeID = null, returnRow = false}) {
    if (value === undefined || value === null) return false;
    // generate select clause dynamically if return row is true
    const selectClause = returnRow ? 'SELECT *' : 'SELECT 1';
    
    // Check if value is an array
    const isArrayValue = Array.isArray(value);
    
    // Set operator and value formatting based on whether it's an array or single value
    const operator = isArrayValue ? 'IN' : '=';
    const valuePlaceholder = isArrayValue ? '($[value:csv])' : '$[value]';
    
    let query_template = `
        ${selectClause} FROM $[schema:name].$[tableName:name] WHERE $[colName:name] ${operator} ${valuePlaceholder}
    `;
    // core parameters of conflict_check
    const params = {
        schema: schema,
        tableName: tableName,
        colName: colName,
        value: value
    }
    // if an exlusion is provided add it the the query template and make one more parameter named excludeID
    if (excludeID !== null) {
        query_template += ` AND user_id != $[excludeID]`;
        params.excludeID = excludeID;
    }

    try {
        // generate final query
        let formatted_query = pgp.as.format(query_template, params);
        
        let response;
        if (isArrayValue) {
             // For array, we expect multiple rows potentially
             response = await db.any(formatted_query);
        } else {
             // For single value, preserve strict oneOrNone check
             response = await db.oneOrNone(formatted_query);
        }

        if (returnRow) {
            return response; // return response row (array if isArrayValue, object/null if not)
        } else {
            // preserve boolean behaviour
            if (isArrayValue) {
                 return response.length > 0;
            }
            return response !== null
        }
    } catch (err) {
        console.log(`Error in checking conflicts from the server for Table: ${tableName}: `, err);
        return false;
    }
}