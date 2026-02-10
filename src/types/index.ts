export type Role = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: Role;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  content: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  author_id: string;
  author_name: string;
  created_at: string;
}
