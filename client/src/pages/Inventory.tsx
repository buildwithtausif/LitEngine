import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { RefreshCw, Trash2 } from "lucide-react";
import { useSearch } from "../contexts/SearchContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface InventoryItem {
  _id: string;
  bookid: string;
  totalqty: number;
  currentqty: number;
  title?: string;
  isbn?: string;
}

interface Book {
  _id: string;
  title: string;
  isbn: string;
}

const Inventory = () => {
  useDocumentTitle("Inventory | LitEngine");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm } = useSearch();

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [invData, booksData] = await Promise.all([
        apiRequest<InventoryItem[]>("/inventory"),
        apiRequest<Book[]>("/books"),
      ]);

      const mergedInv = invData.map((item) => {
        const book = booksData.find((b) => b._id === item.bookid);
        return {
          ...item,
          title: book ? book.title : "Unknown Book",
          isbn: book ? book.isbn : "N/A",
        };
      });

      setInventory(mergedInv);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateStock = async (
    item: InventoryItem,
    newTotalQty: number
  ) => {
    if (newTotalQty < 0 || isNaN(newTotalQty)) return;

    // Calculate new currentqty: if increasing stock, add the difference to available
    // If decreasing, ensure currentqty doesn't exceed new total
    const borrowed = item.totalqty - item.currentqty;
    const newCurrentQty = Math.max(0, newTotalQty - borrowed);

    try {
      await apiRequest("/inventory", "POST", {
        bookid: item.bookid,
        totalqty: newTotalQty,
        currentqty: newCurrentQty,
      });
      fetchInventory();
    } catch (e) {
      console.error("Failed to update stock", e);
      alert("Failed to update stock");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm("Delete this inventory record?")) return;
    try {
      // API expects { ids: [...] } for deletion
      await apiRequest("/inventory", "DELETE", { ids: [item._id] });
      fetchInventory();
    } catch (e) {
      console.error("Failed to delete", e);
      alert("Failed to delete inventory item. It may have active loans.");
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      (item.title &&
        item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.isbn && item.isbn.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
          Inventory Management
        </h1>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Book Details
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">
                    Total Stock
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">
                    Available
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">
                    Borrowed
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">
                    Status
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => {
                    const borrowed = item.totalqty - item.currentqty;
                    return (
                      <tr
                        key={item._id}
                        className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-medium text-slate-800 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            ISBN: {item.isbn}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            ID: {item._id}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            min="0"
                            defaultValue={item.totalqty}
                            onBlur={(e) => {
                              const newVal = parseInt(e.target.value);
                              if (newVal !== item.totalqty) {
                                handleUpdateStock(item, newVal);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-20 text-center p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-4 text-center text-sm font-bold text-green-600 dark:text-green-400">
                          {item.currentqty}
                        </td>
                        <td className="p-4 text-center text-sm font-bold text-amber-600 dark:text-amber-400">
                          {borrowed}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              item.currentqty > 0
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                            }`}
                          >
                            {item.currentqty > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-400 dark:text-slate-500"
                    >
                      No inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
