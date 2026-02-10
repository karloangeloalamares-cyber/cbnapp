import { NewsArticle } from '../types';
import { MOCK_NEWS } from './mockData';

// In-memory store
let newsArticles = [...MOCK_NEWS];

export const newsService = {
    getAll: async (): Promise<NewsArticle[]> => {
        return newsArticles.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    },

    create: async (
        headline: string,
        content: string,
        authorId: string,
        authorName: string,
        imageUrl?: string,
        linkUrl?: string,
        linkText?: string
    ): Promise<NewsArticle> => {
        const newArticle: NewsArticle = {
            id: `n${Date.now()}`,
            headline,
            content,
            image_url: imageUrl,
            link_url: linkUrl,
            link_text: linkText,
            author_id: authorId,
            author_name: authorName,
            created_at: new Date().toISOString(),
        };
        newsArticles.unshift(newArticle);
        return newArticle;
    },
};
