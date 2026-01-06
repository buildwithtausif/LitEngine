/**
 *
 * @param {string} options.tableName --> name of the table in database
 * @param {string} options.colName --> name of the column in database
 * @param {any} options.value - The value to search for value
 * @param {number|string} [options.excludeId] - (Optional) A user_id/uuid to exclude from the search.
 * @param {boolean} [options.returnRow=false] - If true, returns the full row object instead of a boolean.
 * @returns {Promise<boolean|object|null>} Returns boolean by default, or the record object/null if returnRow is true.
 */
export default function recordExist({ schema, tableName, colName, value, excludeID, returnRow }: {
    schema: any;
    tableName: any;
    colName: any;
    value: any;
    excludeID?: null | undefined;
    returnRow?: boolean | undefined;
}): Promise<any>;
//# sourceMappingURL=dbUtils.model.d.ts.map