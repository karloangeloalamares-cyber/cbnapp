import { User } from '../types';
import { MOCK_USERS } from './mockData';

export const authService = {
    login: async (email: string): Promise<{ user: User | null; error: string | null }> => {
        const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            return { user, error: null };
        }
        return { user: null, error: 'User not found. Try: admin@cbn.com, alice@example.com, or bob@example.com' };
    },

    isAdmin: (user: User | null): boolean => {
        return user?.role === 'admin';
    }
};
