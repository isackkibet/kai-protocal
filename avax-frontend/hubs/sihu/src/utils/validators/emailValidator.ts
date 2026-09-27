/**
 * Email validation utilities
 */

export const emailValidator = {
  /**
   * Validate email format
   */
  isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate and normalize email
   */
  normalize(email: string): string {
    return email.toLowerCase().trim();
  },

  /**
   * Check if email format is valid
   */
  validate(email: string): { valid: boolean; error?: string } {
    const normalized = this.normalize(email);

    if (!normalized) {
      return { valid: false, error: 'Email is required' };
    }

    if (!this.isValid(normalized)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
  },
};
