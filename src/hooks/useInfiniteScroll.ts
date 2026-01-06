import { useEffect, useRef, useState, useCallback } from 'react';

export const useInfiniteScroll = (
  loadMore: () => Promise<void>,
  hasMore: boolean,
  isLoading: boolean,
  threshold = 100
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isFetching, setIsFetching] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (isFetching || isLoading || !hasMore) return;
    
    setIsFetching(true);
    try {
      await loadMore();
    } catch (error) {
      console.error('Error loading more content:', error);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, isLoading, hasMore, loadMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isFetching && !isLoading && hasMore) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore, hasMore, isLoading, isFetching, threshold]);

  return {
    sentinelRef,
    isFetching,
  };
};