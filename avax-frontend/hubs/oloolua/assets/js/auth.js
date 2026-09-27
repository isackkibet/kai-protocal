import { supabase } from '../../services/supabase.js';

/**
 * Authentication Service for Oloolua Youth Guardians
 * Uses self-contained local authentication aligned with KAI Nuvari CFA permissions.
 */

const AuthService = {
    /**
     * Attempt to log in a guardian/member
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<object|null>} User object if successful
     */
    login: async function (email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Login error:', error);
                return null;
            }
            
            return data.user;
        } catch (err) {
            console.error('Auth error:', err);
            return null;
        }
    },

    /**
     * Log out the current user
     */
    logout: async function () {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    },

    /**
     * Get current logged in user
     * @returns {Promise<object|null>}
     */
    getCurrentUser: async function () {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /**
     * Check if user is authenticated, redirect if not
     */
    checkAuth: async function () {
        const user = await this.getCurrentUser();
        if (!user) {
            if (!window.location.href.includes('login.html')) {
                window.location.href = 'login.html';
            }
            return false;
        }
        return true;
    }
};

export default AuthService;
