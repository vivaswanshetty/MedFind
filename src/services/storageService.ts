import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@medfind_recent_searches_v1';
const FAVORITES_KEY = '@medfind_favorites_v1';
const MAX_RECENT_SEARCHES = 8;

export const storageService = {
  /**
   * Fetch recent search terms from local device storage (no cloud tracking)
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  /**
   * Save a search query to local storage
   */
  async saveRecentSearch(query: string): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    try {
      const existing = await this.getRecentSearches();
      const filtered = existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  /**
   * Clear all recent searches
   */
  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // noop
    }
  },

  /**
   * Retrieve list of bookmarked / favorited medicine IDs
   */
  async getFavoriteIds(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(FAVORITES_KEY);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  /**
   * Toggle a medicine in local favorites
   */
  async toggleFavorite(id: string): Promise<boolean> {
    try {
      const existing = await this.getFavoriteIds();
      const isFav = existing.includes(id);
      const updated = isFav ? existing.filter((item) => item !== id) : [...existing, id];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return !isFav;
    } catch {
      return false;
    }
  },

  /**
   * Check if a specific medicine is favorited
   */
  async isFavorite(id: string): Promise<boolean> {
    try {
      const existing = await this.getFavoriteIds();
      return existing.includes(id);
    } catch {
      return false;
    }
  },
};
