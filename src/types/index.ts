export type Role = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  avatar_url?: string;
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

export type ReactionTargetType = 'news' | 'announcement';
export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'thanks';

export interface Reaction {
  id: string;
  target_type: ReactionTargetType;
  target_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}

export type PostTargetType = 'news' | 'announcement';

export interface PostView {
  id: string;
  target_type: PostTargetType;
  target_id: string;
  user_id: string;
  created_at: string;
}

export type SavedTargetType = 'news' | 'announcement';

export interface SavedItem {
  id: string;
  target_type: SavedTargetType;
  target_id: string;
  user_id: string;
  created_at: string;
}

export type NotificationType = 'news_posted' | 'announcement_posted';

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string;
  target_type: PostTargetType;
  target_id: string;
  created_at: string;
  read_at: string | null;
}
