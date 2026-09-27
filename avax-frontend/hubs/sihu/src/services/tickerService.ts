export type TickerItem = {
  id: string;
  text: string;
  is_breaking: boolean;
  created_at?: string;
};

const STORAGE_KEY = 'sango_ticker';

const defaultTickers: TickerItem[] = [
  { id: '1', text: 'Welcome to SIHU Hub - Community media and environmental intelligence.', is_breaking: false },
  { id: '2', text: 'Lake Victoria Basin conservation initiatives updated for Q3.', is_breaking: true }
];

export const tickerService = {
  getTickerItems: async (): Promise<TickerItem[]> => {
    return getTickerFromStorage();
  },

  addTickerItem: async (text: string, isBreaking: boolean = false): Promise<void> => {
    addTickerToStorage({
      id: Date.now().toString(),
      text,
      is_breaking: isBreaking,
      created_at: new Date().toISOString()
    });
  },

  deleteTickerItem: async (id: string): Promise<void> => {
    deleteTickerFromStorage(id);
  }
};

// Local storage management
const getTickerFromStorage = (): TickerItem[] => {
  if (typeof window === 'undefined') return defaultTickers;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTickers));
    }
    return defaultTickers;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed && parsed.length > 0 ? parsed : defaultTickers;
  } catch {
    return defaultTickers;
  }
};

const addTickerToStorage = (item: TickerItem) => {
  const items = getTickerFromStorage();
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...items]));
  }
};

const deleteTickerFromStorage = (id: string) => {
  const items = getTickerFromStorage().filter(i => i.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
};
