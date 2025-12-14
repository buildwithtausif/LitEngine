-- DROP DATABASE IF-EXISTS ON SETUP
-- DROP DATABASE  litengine;
-- CREATE SCHEMA FOR litengine IF-NOT-EXISTS
CREATE SCHEMA IF NOT EXISTS library;
-- DROP TABLES IF-EXISTS ON SETUP
DROP TABLE IF EXISTS library.bookLoans;
DROP TABLE IF EXISTS library.inventory;
DROP TABLE IF EXISTS library.books;
DROP TABLE IF EXISTS library.users;
-- CREATE TABLES (1. USERS)
-- THIS NOW SUPPORTS SOFT DELETE
CREATE TABLE library.users (
    _id VARCHAR(30) PRIMARY KEY NOT NULL,
    email VARCHAR(255) UNIQUE NULL,
    name  varchar(255),
    created_at timestamptz DEFAULT NOW() NOT NULL,
    updated_at timestamptz DEFAULT NOW() NOT NULL,
    deleted_at timestamptz NULL
);
-- IMPLEMENTATION OF SOFT DELETE
ALTER TABLE library.users
ADD CONSTRAINT deleted_user_anonymized
CHECK (
    deleted_at IS NULL
    OR (
        name = 'DELETED_USER'
        AND email IS NULL
    )
);

-- CREATE TABLES (2. BOOKS)
CREATE TABLE library.books(
    _id UUID PRIMARY KEY NOT NULL,
    isbn VARCHAR(30) unique NULL,
    title VARCHAR(255),
    author VARCHAR(255),
    publisher VARCHAR(255) NULL,
    created_at timestamptz DEFAULT NOW() NOT NULL,
    updated_at timestamptz DEFAULT NOW() NOT NULL
);
-- CREATE TABLES (3. INVENTORY)
CREATE TABLE library.inventory(
    _id UUID PRIMARY KEY NOT NULL,
    bookId UUID,
    totalQty INT DEFAULT 0,
    currentQty INT,
    created_at timestamptz DEFAULT NOW() NOT NULL,
    updated_at timestamptz DEFAULT NOW() NOT NULL,
    deleted_at timestamptz NULL,
    FOREIGN KEY (bookId) REFERENCES library.books(_id)
);
-- CREATE TABLES (4. BOOK LOANS)
CREATE TABLE library.bookLoans(
    _id UUID PRIMARY KEY NOT NULL,
    loaned_to VARCHAR(30),
    loaned_item UUID,
    loaned_at timestamptz DEFAULT NOW() NOT NULL,
    due_by timestamptz NOT NULL,
    returned_on timestamptz NULL,
    FOREIGN KEY (loaned_to) REFERENCES library.users(_id),
    FOREIGN KEY (loaned_item) REFERENCES library.inventory(_id)
);