/***
 * Generates a unique public-facing identifier based on a specific scheme.
 * The ID is composed of the current year and day, a random crypto secured 6-character alphabetical string,
 * formatted as 'YYDDD-XXXXXX'. This format is
 * human-readable and provides a degree of temporal context.
 * * Public ID scheme: YYDDD-XXXXXX
 * * YY is 2-digit-year
 * * DDD is the 3-digit day in a year 001 for Januaray 1
 * * COLLISION PROOF: 1 billion unique IDs per day
 * * @returns {string} The formatted public ID string.
 ***/
export default function generatePublicId(): string;
/***
 * Generates a standard RFC 4122 version 4 UUID. This function serves as a simple
 * wrapper around the Node.js crypto module's built-in `randomUUID` method,
 * ensuring a cryptographically strong, random, and unique identifier.
 *  * @returns {string} A 36-character UUID string (e.g., "123e4567-e89b-12d3-a456-426614174000").
 */
export declare function generateUuid(): `${string}-${string}-${string}-${string}-${string}`;
//# sourceMappingURL=id_service.d.ts.map