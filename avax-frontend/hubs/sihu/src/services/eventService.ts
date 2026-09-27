import { Event, defaultEvents } from '../constants/articles';

const STORAGE_KEY = 'sango_events';

export const eventService = {
  getEvents: (): Event[] => {
    if (typeof window === 'undefined') return defaultEvents;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultEvents;
  },
  saveEvents: (events: Event[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  },
  addEvent: (event: Event) => {
    const events = eventService.getEvents();
    eventService.saveEvents([event, ...events]);
  },
  updateEvent: (id: string, updated: Partial<Event>) => {
    const events = eventService.getEvents().map(e => 
      e.id === id ? { ...e, ...updated } : e
    );
    eventService.saveEvents(events);
  },
  deleteEvent: (id: string) => {
    const events = eventService.getEvents().filter(e => e.id !== id);
    eventService.saveEvents(events);
  }
};
