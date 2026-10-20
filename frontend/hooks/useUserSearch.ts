import { useCallback, useEffect, useState } from 'react';
import UserService from '@/services/userService';
import type { UserSearchResult } from '@/types/social';
import { apiErrorMessage } from '@/utils/apiError';

export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_QUERY_LENGTH = 2;

/**
 * Searches users by name or email as the user types: waits until typing
 * pauses, needs at least 2 characters, and drops responses to older queries.
 */
export const useUserSearch = () => {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setQuery = useCallback((text: string) => {
    setQueryState(text);
    if (text.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) return;

    let stale = false;
    const timer = setTimeout(() => {
      setSearching(true);
      UserService.searchUsers(q)
        .then(
          (found) => {
            if (stale) return;
            setResults(found);
            setError(null);
          },
          (searchError) => {
            if (!stale) setError(apiErrorMessage(searchError));
          },
        )
        .finally(() => {
          if (!stale) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  /** Updates one result in place, e.g. after a friend request was sent */
  const updateResult = useCallback((userId: string, changes: Partial<UserSearchResult>) => {
    setResults((current) =>
      current.map((result) => (result._id === userId ? { ...result, ...changes } : result)),
    );
  }, []);

  return { query, setQuery, results, searching, error, updateResult };
};
