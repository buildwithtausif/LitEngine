import db from './db.mjs'; // api_database
/*
    a model is the sole which interacts with the database and forwards the result to controller isn't?
*/
// list all existing users from database
export async function list_users() {
    let get_query = `
        SELECT _id, name, email, created_at, updated_at
        FROM library.users
        WHERE deleted_at IS NULL
    `;
    // it's user model what i've to do is to import users table from database
    try {
        const users = await db.any(get_query);
        return users; 
    } catch (err) {
        throw err;
    }
}
// find a user from their _id 
export async function find_user_by_id(_id) {
    let get_query = `
        SELECT _id, "name", email, created_at, updated_at
        FROM library.users
        WHERE _id = $1 AND deleted_at IS NULL
    `;
    try {
        const user = await db.oneOrNone(get_query, [_id]);
        return user;
    } catch (err) {
        throw err;
    }
}
export async function find_user_by_email(email) {
    let get_query = `
        SELECT _id, "name", email, created_at, updated_at
        FROM library.users 
        WHERE email = $1 AND deleted_at IS NULL
    `;
    try {
        const user = await db.oneOrNone(get_query, [email]);
        return user;
    } catch (err) {
        throw err;
    }
}
// create a new user in database
export async function create_user(name, email, _id) {
   let post_query = `
        INSERT INTO library.USERS (_id,email,name)
        VALUES ($1, $2, $3)
        RETURNING _id, "name", email, created_at, updated_at;
   `;

   try {
        const newUser = await db.one(post_query, [_id,email,name]);
        return newUser;
   } catch (err) {
        throw err;
   }
}
// update user-details in database
export async function edit_user(_id, newName, newEmail) {
    let put_query = `
        UPDATE library.users
        SET 
            name = COALESCE($2, name),
            email = COALESCE($3, email),
            updated_at = 
                    CASE 
                        -- WHEN A REAL CHANGE IS DETECTED --
                        WHEN 
                            ($2 IS NOT NULL AND users.name IS DISTINCT FROM $2)
                            OR
                            ($3 IS NOT NULL AND users.email IS DISTINCT FROM $3)
                        -- IF ANY OF THE TWO OCCURED SET NEW TIMESTAMP --
                        THEN now()
                        -- ELSE SET THE OLD VALUE --
                        ELSE updated_at
                    END
        WHERE
            _id = $1 AND deleted_at IS NULL
        RETURNING *;
    `;
    try {
        const updated_data = await db.oneOrNone(put_query, [_id, newName, newEmail]);
        return updated_data;
    } catch (err) {
        throw err;
    }
}
// soft delete user
export async function softDelete(_id) {
    let delete_query = `
        UPDATE library.users
        SET "name" = 'DELETED_USER',
	         email = null,
             deleted_at = NOW()
        WHERE _id = $1
        RETURNING *;
    `;
    try {
        const deleted_user = await db.oneOrNone(delete_query, [_id]);
        return deleted_user
    } catch (err) {
        throw err;
    }
}