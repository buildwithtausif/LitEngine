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

#### Books (`/books`)

| Method  | Endpoint | Description                                                 |
| :------ | :------- | :---------------------------------------------------------- |
| `GET`   | `/books` | Retrieve books with filtering (title, author, genre, etc.). |
| `POST`  | `/books` | Add one or more books to the library.                       |
| `PATCH` | `/books` | Update book details.                                        |

#### Borrow (`/borrow`)

| Method | Endpoint  | Description                                                  |
| :----- | :-------- | :----------------------------------------------------------- |
| `POST` | `/borrow` | Issue books to a user (checks for overdue items and limits). |

#### Inventory (`/inventory`)

| Method   | Endpoint     | Description                                                    |
| :------- | :----------- | :------------------------------------------------------------- |
| `GET`    | `/inventory` | View inventory levels.                                         |
| `POST`   | `/inventory` | Add stock to inventory.                                        |
| `DELETE` | `/inventory` | Remove items from inventory (prevented if active loans exist). |

#### Return (`/return`)

| Method  | Endpoint  | Description                              |
| :------ | :-------- | :--------------------------------------- |
| `PATCH` | `/return` | Return borrowed books by transaction ID. |

#### Users (`/users`)

| Method   | Endpoint          | Description                                           |
| :------- | :---------------- | :---------------------------------------------------- |
| `GET`    | `/users`          | List users or find by ID/Email.                       |
| `POST`   | `/users`          | Register a new user.                                  |
| `PATCH`  | `/users/:user_id` | Update user details.                                  |
| `DELETE` | `/users/:user_id` | Soft delete a user (prevented if active loans exist). |

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
