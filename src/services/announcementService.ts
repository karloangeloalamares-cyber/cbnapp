import { Announcement } from '../types';
import { MOCK_ANNOUNCEMENTS } from './mockData';

export const announcementService = {
    getAll: async (): Promise<Announcement[]> => {
        // Return sorted by date (newest first)
        return [...MOCK_ANNOUNCEMENTS].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    },

    create: async (title: string, content: string, authorId: string, authorName: string): Promise<Announcement> => {
        const newAnnouncement: Announcement = {
            id: Math.random().toString(36).substring(7),
            title,
            content,
            author_id: authorId,
            author_name: authorName,
            created_at: new Date().toISOString(),
        };
        MOCK_ANNOUNCEMENTS.push(newAnnouncement);
        return newAnnouncement;
    }
};
