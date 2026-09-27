/**
 * Centralized TypeScript types and interfaces
 */

// User/Auth Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: User | null;
  email?: string;
}

// Content Types
export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  author?: string;
  category?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  duration: number;
  audioUrl?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  createdAt: string;
}

// Waitlist Types
export interface WaitlistEntry {
  email: string;
  joinedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
