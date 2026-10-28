import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaceSuggestion } from '@/types/walkPlanner';
import { newSessionToken } from '@/utils/sessionToken';
import i18n from '@/i18n';

export const PLACE_SEARCH_DEBOUNCE_MS = 300;
export const MIN_PLACE_QUERY_LENGTH = 3;

type SearchPlaces = (query: string, sessionToken: string) => Promise<PlaceSuggestion[]>;

/**
 * Place search as the user types: waits until typing pauses, needs at least
 * 3 characters, and drops answers to older queries. All searches until a
 * place is picked share one session token (call endSession() after picking),
 * so Google bills them as one search.
 */
export const usePlaceSearch = (search: SearchPlaces) => {
  const [query, setQueryState] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState(newSessionToken);
  // The latest search function and token, for the debounced effect: a new
  // token alone mustn't trigger a search
  const searchRef = useRef(search);
  const tokenRef = useRef(sessionToken);
  useEffect(() => {
    searchRef.current = search;
    tokenRef.current = sessionToken;
  }, [search, sessionToken]);
  // The name of a picked place, shown in the box without searching for it
  const pickedText = useRef<string | null>(null);

  const setQuery = useCallback((text: string) => {
    setQueryState(text);
    if (text.trim().length < MIN_PLACE_QUERY_LENGTH) {
      setSuggestions([]);
      setError(null);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_PLACE_QUERY_LENGTH) return;
    if (pickedText.current === query) {
      pickedText.current = null;
      return;
    }

    let stale = false;
    const timer = setTimeout(() => {
      setSearching(true);
      searchRef.current(q, tokenRef.current)
        .then(
          (found) => {
            if (stale) return;
            setSuggestions(found);
            setError(null);
          },
          () => {
            if (stale) return;
            setSuggestions([]);
            setError(i18n.t('planner:search.unavailable'));
          },
        )
        .finally(() => {
          if (!stale) setSearching(false);
        });
    }, PLACE_SEARCH_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  /**
   * After a place was picked: the next search is a new session. Pass the
   * place's name to show it in the box (without searching for it).
   */
  const endSession = useCallback((placeText?: string) => {
    setSessionToken(newSessionToken());
    setSuggestions([]);
    if (placeText !== undefined) {
      pickedText.current = placeText;
      setQueryState(placeText);
    }
  }, []);

  /** Clears the search box and starts a new session */
  const reset = useCallback(() => {
    setQueryState('');
    setSuggestions([]);
    setError(null);
    setSessionToken(newSessionToken());
  }, []);

  return { query, setQuery, suggestions, searching, error, sessionToken, endSession, reset };
};
