import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    refreshNotifications: () => Promise<void>;
    markRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    refreshNotifications: async () => { },
    markRead: () => { },
});

const mapNotification = (item: any): AppNotification => ({
    ...item,
    id: item.id.toString(),
    recipient_id: item.recipient_id.toString(),
    target_id: item.target_id.toString(),
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const canNotify = !!user;

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Initial load + Refresh logic
    const refreshNotifications = useCallback(async () => {
        if (!canNotify || !user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            // Load list and count in parallel
            const [data, count] = await Promise.all([
                notificationService.getAll(user.id),
                notificationService.getUnreadCount(user.id),
            ]);
            setNotifications(data);
            setUnreadCount(count);
        } catch (error) {
            console.warn('Failed to refresh notifications', error);
        }
    }, [canNotify, user]);

    // Optimistic mark read
    const markRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    // Effect: Load on mount/user change
    useEffect(() => {
        if (canNotify) {
            setLoading(true);
            refreshNotifications().finally(() => setLoading(false));
        }
    }, [canNotify, refreshNotifications]);

    // Effect: Real-time subscription
    useEffect(() => {
        if (!canNotify || !user) return;

        const channel = supabase
            .channel(`cbn-app-notifications-global-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'cbn_app_notifications',
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const newItem = mapNotification(payload.new);
                    setNotifications((prev) => [newItem, ...prev]);
                    if (!newItem.read_at) {
                        setUnreadCount((prev) => prev + 1);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'cbn_app_notifications',
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const updated = mapNotification(payload.new);
                    setNotifications((prev) =>
                        prev.map((item) => (item.id === updated.id ? updated : item))
                    );
                    // Re-calc unread count if needed, or just let refresh handle it on next pull
                    // For now, simpler to just keep the local state consistent
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [canNotify, user]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loading, refreshNotifications, markRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
