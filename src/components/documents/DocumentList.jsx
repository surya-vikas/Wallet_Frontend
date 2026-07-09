import { useRef, useCallback, useEffect, useState } from 'react';
import DocumentCard from './DocumentCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { FileText } from 'lucide-react';

export default function DocumentList({ documents, loading, hasMore, onLoadMore, onDocClick, onFavorite, emptyMessage }) {
  const observer = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  const lastDocRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore?.();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, onLoadMore]
  );

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading && documents.length === 0) return <LoadingSpinner size="lg" />;

  if (!loading && documents.length === 0) {
    return (
      <EmptyState icon={FileText} title="No documents yet" message={emptyMessage || 'Upload your first document to get started'} />
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {documents.map((doc, idx) => (
        <div key={doc._id} ref={idx === documents.length - 1 ? lastDocRef : null}>
          <DocumentCard doc={doc} onClick={() => onDocClick?.(doc._id)} onFavorite={onFavorite} />
        </div>
      ))}
      {loading && <LoadingSpinner size="sm" />}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center active:scale-90"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
