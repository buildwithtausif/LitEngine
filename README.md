# LitEngine API

**LitEngine** is a robust backend API for a library management system, built with Node.js, Express, and PostgreSQL. It follows a CQRS-inspired architecture and supports inventory management, book lending, and user administration.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your `.env` file with the following database credentials:
    ```env
    PSQL_USER=your_postgres_username
    PSQL_PASS=your_postgres_password
    PSQL_DB=library
    ```
    _(Ensure these match your local PostgreSQL setup)_
4.  Initialize the database:
    ```bash
    # Run the setup script in your PostgreSQL instance
    psql -U <username> -d <dbname> -f sql/lit-engine.db.setup.sql
    ```
5.  Run the server:

    ```bash
    # Development
    npm run dev

    # Production
    npm start
    ```

## 📖 API Documentation

The full OpenAPI 3.1 specification is available in [`openapi.yaml`](./openapi.yaml).

### Base URL

Defaults to `http://localhost:8000` (or as configured).

### Endpoints

### Endpoints

#### 📚 Books (`/api/books`)

Manage the library's book collection.

**1. Get Books**
Retrieve books with optional filtering.

- **GET** `/api/books`
- **Query Parameters**:
  - `title`: Partial match (e.g., `?title=Expectations`)
  - `author`: Partial match (e.g., `?author=Dickens`)
  - `genre`: Partial match
  - `isbn`: Exact match
  - `id`: Exact UUID match
- **Example Usage**:
  ```http
  GET /api/books?author=Dickens&genre=Classic
  ```

**2. Add Books**
Add one or more books.

- **POST** `/api/books`
- **Payload** (Single or Array):
  ```json
  {
    "title": "Great Expectations",
    "author": "Charles Dickens",
    "isbn": "978-0141439563",
    "genre": "Classic",
    "publisher": "Penguin Classics",
    "quantity": 5
  }
  ```

**3. Update Book**
Update book details by ID or ISBN.

- **PATCH** `/api/books`
- **Payload**:
  ```json
  {
    "_id": "uuid-of-book", // OR "isbn": "..."
    "edit_book_stack": [
      { "genre": "Victorian Literature" },
      { "publisher": "Vintage" }
    ]
  }
  ```

#### 📖 Borrow (`/api/borrow`)

Handle book lending transactions.

**Issue Books**

- **POST** `/api/borrow`
- **Payload**:
  ```json
  {
    "user_id": "user-id-(not uuid)",
    "books": [{ "bookid": "book-uuid-1" }, { "bookid": "book-uuid-2" }]
  }
  ```
  > **Note**: Checks for user existence, overdue books, and maximum loan limits (3 books/user).

#### 📦 Inventory (`/api/inventory`)

Manage physical stock.

**1. View Inventory**

- **GET** `/api/inventory`
- **Query Parameters**:
  - `id`: View specific inventory item by UUID (e.g., `?id=...`)

**2. Add Stock**

- **POST** `/api/inventory`
- **Payload** (Single or Bulk):
  ```json
  {
    "inventory": [
      {
        "bookid": "book-uuid",
        "totalqty": 10
      }
    ]
  }
  ```
  _(Or single object without `inventory` wrapper)_

**3. Delete Stock**

- **DELETE** `/api/inventory`
- **Payload**:
  ```json
  {
    "ids": ["inventory-uuid-1", "inventory-uuid-2"]
  }
  ```
  > **Constraint**: Cannot delete items that are currently on loan.

#### ↩️ Return (`/api/return`)

Process book returns.

**Return Books**

- **PATCH** `/api/return`
- **Payload**:
  ```json
  [
    { "transaction_id": "loan-transaction-uuid-1" },
    { "transaction_id": "loan-transaction-uuid-2" }
  ]
  ```

#### 👥 Users (`/api/users`)

User management.

**1. List / Find Users**

- **GET** `/api/users`
- **Query Parameters**:
  - `user_id`: Find by ID
  - `email`: Find by Email
- **Example**:
  ```http
  GET /api/users?email=alice@example.com
  ```

**2. Register User**

- **POST** `/api/users`
- **Payload**:
  ```json
  {
    "name": "Alice Wonderland",
    "email": "alice@example.com"
  }
  ```

**3. Update User**

- **PATCH** `/api/users/:user_id`
- **Payload**:
  ```json
  {
    "newName": "Alice W.",
    "newEmail": "alice.new@example.com"
  }
  ```

**4. Delete User**

- **DELETE** `/api/users/:user_id`
- **Effect**: Soft deletes the user.
- **Constraint**: User cannot be deleted if they have active loans.

## 🗄️ Database Schema

The system uses a **PostgreSQL** database with the following core entities:

- **Books**: Metadata (Title, Author, ISBN).
- **Users**: Patrons of the library.
- **Inventory**: Physical copies tracking.
- **BookLoans**: Transaction logs for borrowing/returning.

## 🏗️ key Features

- **Soft Deletes**: Users and inventory are soft-deleted to preserve history.
- **Conflict Detection**: Prevents duplicate ISBNs and emails.
- **Loan Limits**: Enforces maximum borrow limits and overdue checks.

---

_Generated based on OpenAPI Specification v1.0.0_
