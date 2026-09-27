/**
 * API Client Utilities
 * Centralized API call handling with error management
 */

import { ApiResponse } from '@/types';

export const apiClient = {
  /**
   * Make a GET request
   */
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('GET request failed:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  },

  /**
   * Make a POST request
   */
  async post<T>(
    url: string,
    payload: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('POST request failed:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  },

  /**
   * Make a PUT request
   */
  async put<T>(
    url: string,
    payload: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('PUT request failed:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  },

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('DELETE request failed:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  },
};
