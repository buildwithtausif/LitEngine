-- DROP DATABASE IF-EXISTS ON SETUP
DROP DATABASE  litengine;
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
    createdAt timestamptz NOT NULL,
    updatedAt timestamptz NOT NULL,
    deletedAt timestamptz NULL
);
-- IMPLEMENTATION OF SOFT DELETE
ALTER TABLE library.users
ADD CONSTRAINT deleted_user_anonymized
CHECK (
    deletedAt IS NULL
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
    createdAt timestamptz NOT NULL,
    updatedAt timestamptz NOT NULL
);
-- CREATE TABLES (3. INVENTORY)
CREATE TABLE library.inventory(
    _id UUID PRIMARY KEY NOT NULL,
    bookId UUID,
    totalQty INT DEFAULT 0,
    currentQty INT,
    createdAt timestamptz NOT NULL,
    updatedAt timestamptz NOT NULL,
    deletedAt timestamptz NULL,
    FOREIGN KEY (bookId) REFERENCES library.books(_id)
);
-- CREATE TABLES (4. BOOK LOANS)
CREATE TABLE library.bookLoans(
    _id UUID PRIMARY KEY NOT NULL,
    loanedTo VARCHAR(30),
    loanedItem UUID,
    loanedAt timestamptz NOT NULL,
    dueAt timestamptz NOT NULL,
    returnedAt timestamptz NULL,
    FOREIGN KEY (loanedTo) REFERENCES library.users(_id),
    FOREIGN KEY (loanedItem) REFERENCES library.inventory(_id)
);