import { useEffect, useState } from "react";
import { getBookCover } from "../utils/common";
import { Edit2, Package } from "lucide-react";

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publisher: string;
  stock: number;
  available?: number;
}

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onAddToInventory?: (book: Book) => void;
}

const BookCard = ({ book, onEdit, onAddToInventory }: BookCardProps) => {
  const [cover, setCover] = useState<string>("");

  useEffect(() => {
    getBookCover(book).then(setCover);
  }, [book]);

  const total = book.stock || 0;
  const available = book.available || 0;
  const borrowed = total - available;
  const notInInventory = total === 0;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl group h-[360px] bg-slate-800">
      {/* Background Cover Image */}
      <div className="absolute inset-0">
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <span className="text-6xl opacity-20">📚</span>
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end p-5 text-white">
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          {onAddToInventory && (
            <button
              onClick={() => onAddToInventory(book)}
              className="p-2 bg-blue-500/80 backdrop-blur-sm rounded-full text-white hover:bg-blue-600 transition-all"
              title="Add to Inventory"
            >
              <Package size={16} />
            </button>
          )}
          <button
            onClick={() => onEdit(book)}
            className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all"
            title="Edit Book"
          >
            <Edit2 size={16} />
          </button>
        </div>

        {/* Not in Inventory Badge */}
        {notInInventory && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
              Not in Inventory
            </span>
          </div>
        )}

        {/* Title & Author */}
        <h3 className="font-bold text-xl leading-tight mb-1 line-clamp-2 drop-shadow-lg">
          {book.title}
        </h3>
        <p className="text-sm text-white/70 mb-3">by {book.author}</p>

        {/* Genre & Publisher */}
        <p className="text-xs text-white/50 mb-4">
          {book.genre || "Unknown Genre"} •{" "}
          {book.publisher || "Unknown Publisher"}
        </p>

        {/* Badges */}
        <div className="flex gap-2 mb-3">
          <span className="px-2.5 py-1 bg-green-500/20 backdrop-blur-sm rounded-full text-xs font-semibold text-green-300 border border-green-500/30">
            📦 {total} Total
          </span>
          <span className="px-2.5 py-1 bg-blue-500/20 backdrop-blur-sm rounded-full text-xs font-semibold text-blue-300 border border-blue-500/30">
            ✓ {available} Avail
          </span>
          {borrowed > 0 && (
            <span className="px-2.5 py-1 bg-amber-500/20 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-300 border border-amber-500/30">
              📖 {borrowed} Loaned
            </span>
          )}
        </div>

        {/* ISBN */}
        <p className="text-[10px] text-white/40 font-mono">
          ISBN: {book.isbn || "N/A"}
        </p>
      </div>
    </div>
  );
};

export default BookCard;
