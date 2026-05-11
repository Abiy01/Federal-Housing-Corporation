import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
}

/**
 * Sets document title and meta description for the current page.
 * Title is appended with " | FHC" suffix.
 */
export function useSEO({ title, description }: SEOProps) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | FHC`;
    }

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }

    // Restore default on unmount
    return () => {
      document.title = 'FHC - Federal Housing Corporation';
    };
  }, [title, description]);
}
