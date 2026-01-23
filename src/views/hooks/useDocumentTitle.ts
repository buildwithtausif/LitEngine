import { useEffect } from "react";

/**
 * Custom hook to dynamically update the document title
 * @param title - The title to set for the current page
 */
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    // Cleanup function to restore previous title when component unmounts
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
