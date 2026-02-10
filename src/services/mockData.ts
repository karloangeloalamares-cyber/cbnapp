import { User, Announcement, NewsArticle } from '../types';

// Mock Users
export const MOCK_USERS: User[] = [
    { id: 'admin1', email: 'admin@cbn.com', display_name: 'CBN Admin', role: 'admin' },
    { id: 'user1', email: 'alice@example.com', display_name: 'Alice', role: 'user' },
    { id: 'user2', email: 'bob@example.com', display_name: 'Bob', role: 'user' },
];

// Mock Announcements
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'a1',
        title: 'Welcome to CBN App!',
        content: 'We are excited to launch our new communication platform. Stay tuned for updates and announcements.',
        author_id: 'admin1',
        author_name: 'CBN Admin',
        created_at: '2024-01-15T09:00:00Z',
    },
    {
        id: 'a2',
        title: 'Maintenance Notice',
        content: 'The system will undergo scheduled maintenance on January 20th from 2:00 AM to 4:00 AM. Please save your work.',
        author_id: 'admin1',
        author_name: 'CBN Admin',
        created_at: '2024-01-18T14:30:00Z',
    },
    {
        id: 'a3',
        title: 'New Features Coming Soon',
        content: 'We are working on exciting new features including notifications and file sharing. Stay tuned!',
        author_id: 'admin1',
        author_name: 'CBN Admin',
        created_at: '2024-01-20T10:00:00Z',
    },
];

// Mock News Articles
export const MOCK_NEWS: NewsArticle[] = [
    {
        id: 'n1',
        headline: 'Iranian Foreign Minister Abbas Araghchi:',
        content: '"The subject of our talks with the Americans is only the nuclear issue."\n\nThis statement follows a clear warning from Secretary of State **Marco Rubio** earlier this week, who signaled that the United States **will not negotiate on the nuclear file in isolation**. Rubio emphasized that any potential deal must also address Iran\'s **ballistic missile program** and its support for **regional terrorism**.',
        image_url: 'https://picsum.photos/800/400?random=1',
        link_url: 'https://chat.whatsapp.com/example',
        link_text: 'Join CBN UNFILTERED',
        author_id: 'admin1',
        author_name: 'CBN Admin',
        created_at: '2024-01-20T09:44:00Z',
    },
    {
        id: 'n2',
        headline: 'Breaking: New Economic Policy Announced',
        content: 'The government has announced a **major shift** in economic policy that will affect businesses nationwide.\n\nKey changes include:\n• **Tax reforms** for small businesses\n• New **investment incentives** for tech companies\n• Updated regulations on **foreign investments**',
        image_url: 'https://picsum.photos/800/400?random=2',
        link_url: 'https://example.com/policy',
        link_text: 'Read full policy document',
        author_id: 'admin1',
        author_name: 'CBN Admin',
        created_at: '2024-01-19T14:30:00Z',
    },
    {
        id: 'n3',
        headline: 'Tech Update: AI Developments',
        content: 'Major tech companies are racing to develop more **advanced AI systems**.\n\nThis week\'s highlights:\n• **OpenAI** released new capabilities\n• **Google** announced Gemini updates\n• Industry experts warn about **safety concerns**',
        image_url: 'https://picsum.photos/800/400?random=3',
        author_id: 'admin1',
        author_name: 'CBN Admin',
        created_at: '2024-01-18T11:00:00Z',
    },
];
