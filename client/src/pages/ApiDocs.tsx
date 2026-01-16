import { ChevronDown, Server } from "lucide-react";
import { useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  params?: {
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }[];
  body?: string;
  responses?: { status: string; description: string }[];
}

const endpoints: Endpoint[] = [
  // Books
  {
    method: "GET",
    path: "/api/books",
    summary: "Get books",
    description: "Retrieve books based on search criteria.",
    params: [
      {
        name: "title",
        type: "string",
        description: "Filter by title (partial match)",
      },
      {
        name: "author",
        type: "string",
        description: "Filter by author (partial match)",
      },
      {
        name: "isbn",
        type: "string",
        description: "Filter by ISBN (exact match)",
      },
      {
        name: "id",
        type: "uuid",
        description: "Filter by Book UUID (exact match)",
      },
      {
        name: "genre",
        type: "string",
        description: "Filter by genre (partial match)",
      },
    ],
    responses: [{ status: "200", description: "List of books" }],
  },
  {
    method: "POST",
    path: "/api/books",
    summary: "Add books",
    description: "Add one or multiple books to the library.",
    body: `// Single or Array
{
  "title": "Great Expectations",
  "author": "Charles Dickens",
  "isbn": "978-0141439563",
  "genre": "Classic",
  "publisher": "Penguin Classics",
  "quantity": 5
}`,
    responses: [{ status: "201", description: "Books created" }],
  },
  {
    method: "PATCH",
    path: "/api/books",
    summary: "Update book",
    description: "Update book details by ID or ISBN.",
    body: `{
  "_id": "uuid-of-book", 
  // OR "isbn": "..."
  "edit_book_stack": [
    { "genre": "Victorian Literature" },
    { "publisher": "Vintage" }
  ]
}`,
    responses: [{ status: "200", description: "Book updated" }],
  },

  // Borrow/Return
  {
    method: "POST",
    path: "/api/borrow",
    summary: "Borrow books",
    description: "Borrow one or more books for a user.",
    body: `{
  "user_id": "user-uuid",
  "books": [
    { "bookid": "book-uuid-1" }, 
    { "bookid": "book-uuid-2" }
  ]
}`,
    responses: [{ status: "201", description: "Books borrowed" }],
  },
  {
    method: "PATCH",
    path: "/api/return",
    summary: "Return books",
    description: "Return borrowed books by transaction ID.",
    body: `[
  { "transaction_id": "loan-transaction-uuid-1" },
  { "transaction_id": "loan-transaction-uuid-2" }
]`,
    responses: [{ status: "200", description: "Books returned" }],
  },

  // Inventory
  {
    method: "GET",
    path: "/api/inventory",
    summary: "Read inventory",
    description: "Get inventory details.",
    params: [{ name: "id", type: "uuid", description: "Inventory Item ID" }],
    responses: [{ status: "200", description: "Inventory data" }],
  },
  {
    method: "POST",
    path: "/api/inventory",
    summary: "Add to inventory",
    description: "Create new inventory entries.",
    body: `{
  "inventory": [
    {
      "bookid": "book-uuid",
      "totalqty": 10
    }
  ]
}`,
    responses: [{ status: "200", description: "Inventory created" }],
  },
  {
    method: "DELETE",
    path: "/api/inventory",
    summary: "Delete from inventory",
    description: "Delete inventory items (single or bulk).",
    params: [
      {
        name: "id",
        type: "uuid",
        description: "Single ID to delete (query param)",
      },
    ],
    body: `{
  "ids": ["inventory-uuid-1", "inventory-uuid-2"]
}`,
    responses: [{ status: "200", description: "Deleted successfully" }],
  },

  // Users
  {
    method: "GET",
    path: "/api/users",
    summary: "Get users",
    description: "Get all users or find specific user by ID or Email.",
    params: [
      { name: "user_id", type: "string", description: "User ID" },
      { name: "email", type: "string", description: "User Email" },
    ],
    responses: [{ status: "200", description: "User(s) found" }],
  },
  {
    method: "POST",
    path: "/api/users",
    summary: "Register user",
    description: "Create a new user.",
    body: `{
  "name": "Alice Wonderland",
  "email": "alice@example.com"
}`,
    responses: [{ status: "201", description: "User created" }],
  },
  {
    method: "PATCH",
    path: "/api/users/{user_id}",
    summary: "Update user",
    description: "Update user name or email.",
    body: `{
  "newName": "Alice W.",
  "newEmail": "alice.new@example.com"
}`,
    responses: [{ status: "200", description: "User updated" }],
  },
  {
    method: "DELETE",
    path: "/api/users/{user_id}",
    summary: "Delete user",
    description: "Soft delete a user.",
    responses: [{ status: "200", description: "User deleted" }],
  },
];

const MethodBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    POST: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    PATCH:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    DELETE:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold border ${
        colors[method] || "bg-slate-100"
      }`}
    >
      {method}
    </span>
  );
};

const ApiDocs = () => {
  useDocumentTitle("API Documentation | LitEngine");

  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
          <Server size={32} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            API Documentation
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Current Specification v1.0.0
          </p>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          🚀 Getting Started
        </h2>
        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Prerequisites
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Node.js (v18+ recommended)</li>
              <li>PostgreSQL</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Installation
            </h3>
            <ol className="list-decimal list-inside space-y-4 ml-2">
              <li>
                <span className="font-medium">Clone the repository.</span>
              </li>
              <li>
                <span className="font-medium">Install dependencies:</span>
                <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto">
                  npm install
                </pre>
              </li>
              <li>
                <span className="font-medium">
                  Set up your{" "}
                  <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">
                    .env
                  </code>{" "}
                  file:
                </span>
                <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto">
                  PSQL_USER=your_postgres_username{"\n"}
                  PSQL_PASS=your_postgres_password{"\n"}
                  PSQL_DB=library
                </pre>
              </li>
              <li>
                <span className="font-medium">Initialize the database:</span>
                <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto">
                  # Run the setup script in your PostgreSQL instance{"\n"}
                  psql -U &lt;username&gt; -d &lt;dbname&gt; -f
                  sql/lit-engine.db.setup.sql
                </pre>
              </li>
              <li>
                <span className="font-medium">Run the server:</span>
                <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto">
                  # Development{"\n"}
                  npm run dev{"\n\n"}# Production{"\n"}
                  npm start
                </pre>
              </li>
            </ol>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg text-amber-800 dark:text-amber-200">
            <h4 className="font-bold flex items-center gap-2 mb-1">
              ⚠️ Alpha Release Disclaimer
            </h4>
            <p className="text-xs opacity-90">
              This project is currently in <strong>Alpha v1</strong>. It is
              intended for educational and development purposes only. Please do
              not run this directly in a production environment without
              significant security and configuration modifications.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {endpoints.map((endpoint, index) => (
          <div
            key={`${endpoint.method}-${endpoint.path}-${index}`}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all"
          >
            <div
              onClick={() => toggleItem(index)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <MethodBadge method={endpoint.method} />
                <code className="text-sm font-mono text-slate-700 dark:text-slate-300 font-semibold">
                  {endpoint.path}
                </code>
                <span className="text-slate-500 dark:text-slate-400 text-sm truncate">
                  - {endpoint.summary}
                </span>
              </div>
              <ChevronDown
                size={20}
                className={`text-slate-400 transition-transform ${
                  openItems.includes(index) ? "rotate-180" : ""
                }`}
              />
            </div>

            {openItems.includes(index) && (
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="mt-4 space-y-4">
                  <p className="text-slate-600 dark:text-slate-300">
                    {endpoint.description}
                  </p>

                  {endpoint.params && endpoint.params.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                        Parameters
                      </h4>
                      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Type</th>
                              <th className="px-3 py-2">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.params.map((param) => (
                              <tr
                                key={param.name}
                                className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                              >
                                <td className="px-3 py-2 font-mono text-indigo-600 dark:text-indigo-400">
                                  {param.name}
                                </td>
                                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                                  {param.type}
                                </td>
                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                  {param.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {endpoint.body && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                        Request Body
                      </h4>
                      <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 dark:border-slate-700">
                        {endpoint.body}
                      </pre>
                    </div>
                  )}

                  {endpoint.responses && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                        Responses
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {endpoint.responses.map((res) => (
                          <div
                            key={res.status}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                          >
                            <span
                              className={`font-mono font-bold mr-2 ${
                                res.status.startsWith("2")
                                  ? "text-green-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {res.status}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {res.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiDocs;
