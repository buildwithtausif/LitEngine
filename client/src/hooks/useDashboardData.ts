import { useState, useEffect } from "react";
import { apiRequest } from "../services/api";

export interface Transaction {
  transaction_id: string;
  _id?: string; // Mapped for consistency
  user_name: string;
  borrowed_by: string;
  due_date: string;
  book_title?: string;
  bookTitle?: string; // Mapped for Dashboard usage
  book_isbn?: string;
  loaned_at?: string;
  user_email?: string;
  book_id?: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  loans: Transaction[];
  totalqty?: number;
  currentqty?: number;
}

export interface InventoryItem {
  _id: string;
  bookid: string;
  totalqty: number;
  currentqty: number;
}

export const useDashboardData = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    activeTransactions: 0,
    overdueBooks: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [overdueList, setOverdueList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [booksData, usersData] = await Promise.all([
        apiRequest<Book[]>("/books"),
        apiRequest<any[]>("/users"),
      ]);

      let activeLoanCount = 0;
      let overdueCount = 0;
      const allTransactions: Transaction[] = [];

      booksData.forEach((book) => {
        if (book.loans && Array.isArray(book.loans)) {
          book.loans.forEach((loan) => {
            activeLoanCount++;
            const isOverdue = new Date(loan.due_date) < new Date();
            if (isOverdue) overdueCount++;

            const borrower = usersData.find((u) => u._id === loan.borrowed_by);

            allTransactions.push({
              ...loan, // Keep original fields (loaned_at, due_date, etc.)
              _id: loan.transaction_id || loan._id || "", // Ensure we have a valid ID for React keys and actions
              transaction_id: loan.transaction_id || loan._id || "", // Ensure explicit transaction_id field is populated
              bookTitle: book.title, // Map to camelCase as expected by Dashboard.tsx
              book_title: book.title, // Keep snake_case just in case
              book_isbn: book.isbn,
              loaned_at: (loan as any).loaned_at || new Date().toISOString(), // Fallback if missing
              user_name: borrower ? borrower.name : "Unknown User",
              user_email: borrower ? borrower.email : "N/A",
              borrowed_by: loan.borrowed_by,
              book_id: book._id,
            });
          });
        }
      });

      // Sort by due date (active first?) or just reverse to show "latest added" roughly
      const sortedTransactions = [...allTransactions].reverse();

      setStats({
        totalBooks: booksData.length,
        totalUsers: usersData.length,
        activeTransactions: activeLoanCount,
        overdueBooks: overdueCount,
      });

      setRecentTransactions(sortedTransactions.slice(0, 5));
      setOverdueList(
        allTransactions.filter((t) => new Date(t.due_date) < new Date())
      );
    } catch (error) {
      console.error("Dashboard fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    stats,
    recentTransactions,
    overdueList,
    loading,
    refresh: fetchData,
  };
};
