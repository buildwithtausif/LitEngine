const COVER_CACHE_KEY = "book_covers_cache";
const CACHE_VERSION = 1;

interface CoverCache {
  version: number;
  covers: Record<string, { url: string; timestamp: number }>;
}

function getCoverCache(): CoverCache {
  try {
    const cached = localStorage.getItem(COVER_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.version === CACHE_VERSION) {
        return data;
      }
    }
  } catch (e) {
    // Invalid cache, reset
  }
  return { version: CACHE_VERSION, covers: {} };
}

function setCoverCache(cache: CoverCache) {
  try {
    localStorage.setItem(COVER_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Storage full or unavailable
  }
}

function getCacheKey(book: {
  isbn?: string;
  title?: string;
  author?: string;
}): string {
  if (book.isbn) return `isbn:${book.isbn}`;
  return `title:${book.title || ""}:${book.author || ""}`;
}

export async function getBookCover(book: {
  isbn?: string;
  title?: string;
  author?: string;
}): Promise<string> {
  const placeholder =
    "https://placehold.co/128x192/1f2937/9ca3af?text=No+Cover";

  const cacheKey = getCacheKey(book);

  // Check cache first
  const cache = getCoverCache();
  const cached = cache.covers[cacheKey];

  // Use cached value if less than 24 hours old
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.url;
  }

  let coverUrl = placeholder;

  if (book.isbn) {
    try {
      const openLibraryUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false`;
      const response = await fetch(openLibraryUrl, { method: "HEAD" });
      if (
        response.ok &&
        response.headers.get("content-type")?.startsWith("image/")
      ) {
        coverUrl = openLibraryUrl;
      }
    } catch (e) {
      /* Fallback */
    }

    if (coverUrl === placeholder) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}&maxResults=1`
        );
        const data = await response.json();
        if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
          coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace(
            "http://",
            "https://"
          );
        }
      } catch (error) {
        /* Fallback */
      }
    }
  }

  if (coverUrl === placeholder && book.title) {
    try {
      const query = `intitle:${encodeURIComponent(book.title)}${
        book.author ? `+inauthor:${encodeURIComponent(book.author)}` : ""
      }`;
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`
      );
      const data = await response.json();
      if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
        coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace(
          "http://",
          "https://"
        );
      }
    } catch (error) {
      /* Final fallback */
    }
  }

  // Save to cache
  cache.covers[cacheKey] = { url: coverUrl, timestamp: Date.now() };
  setCoverCache(cache);

  return coverUrl;
}

// Clear specific book from cache (for when a book is updated)
export function invalidateCoverCache(book: {
  isbn?: string;
  title?: string;
  author?: string;
}) {
  const cacheKey = getCacheKey(book);
  const cache = getCoverCache();
  delete cache.covers[cacheKey];
  setCoverCache(cache);
}

// Clear all cover cache
export function clearCoverCache() {
  localStorage.removeItem(COVER_CACHE_KEY);
}
