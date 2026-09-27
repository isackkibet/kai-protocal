import { Podcast, defaultPodcasts } from '../constants/articles';

const STORAGE_KEY = 'sango_podcasts';

export const podcastService = {
  getPodcasts: async (): Promise<Podcast[]> => {
    return getPodcastsFromStorage();
  },

  addPodcast: async (podcast: Podcast): Promise<void> => {
    addPodcastToStorage(podcast);
  },

  deletePodcast: async (id: string): Promise<void> => {
    deletePodcastFromStorage(id);
  }
};

// Local storage management
const getPodcastsFromStorage = (): Podcast[] => {
  if (typeof window === 'undefined') return defaultPodcasts;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPodcasts));
    }
    return defaultPodcasts;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed && parsed.length > 0 ? parsed : defaultPodcasts;
  } catch {
    return defaultPodcasts;
  }
};

const addPodcastToStorage = (podcast: Podcast) => {
  const podcasts = getPodcastsFromStorage();
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([podcast, ...podcasts.filter(p => p.id !== podcast.id)]));
  }
};

const deletePodcastFromStorage = (id: string) => {
  const podcasts = getPodcastsFromStorage().filter(p => p.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(podcasts));
  }
};
