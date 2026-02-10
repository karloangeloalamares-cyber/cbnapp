import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Pressable, Linking, SafeAreaView, RefreshControl } from 'react-native';
import { newsService } from '../services/newsService';
import { NewsArticle } from '../types';
import { theme } from '../theme';

// Helper to render bold text marked with **text**
const RichText = ({ text }: { text: string }) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return (
        <Text style={styles.contentText}>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <Text key={index} style={styles.boldText}>
                            {part.slice(2, -2)}
                        </Text>
                    );
                }
                return <Text key={index}>{part}</Text>;
            })}
        </Text>
    );
};

const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const formatDateLabel = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
};

const getDateKey = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

// Date separator component
const DateSeparator = ({ label }: { label: string }) => (
    <View style={styles.dateSeparatorContainer}>
        <View style={styles.dateSeparatorLine} />
        <View style={styles.dateSeparatorBadge}>
            <Text style={styles.dateSeparatorText}>{label}</Text>
        </View>
        <View style={styles.dateSeparatorLine} />
    </View>
);

const NewsCard = ({ article }: { article: NewsArticle }) => {
    const handleLinkPress = () => {
        if (article.link_url) {
            Linking.openURL(article.link_url);
        }
    };

    return (
        <View style={styles.card}>
            {/* Image */}
            {article.image_url && (
                <Image
                    source={{ uri: article.image_url }}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
            )}

            {/* Content */}
            <View style={styles.contentContainer}>
                {/* Rich text content with bold markers */}
                {article.content ? (
                    <RichText text={article.content} />
                ) : null}

                {/* Link section */}
                {article.link_url && (
                    <Pressable onPress={handleLinkPress} style={styles.linkContainer}>
                        <Text style={styles.linkUrl}>{article.link_url}</Text>
                    </Pressable>
                )}

                {/* Timestamp */}
                <Text style={styles.timestamp}>{formatTime(article.created_at)}</Text>
            </View>
        </View>
    );
};

type ListItem =
    | { type: 'date'; label: string; key: string }
    | { type: 'article'; article: NewsArticle; key: string };

export const NewsScreen = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadNews = async () => {
        const articles = await newsService.getAll();
        setNews(articles);
    };

    useEffect(() => {
        loadNews();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNews();
        setRefreshing(false);
    };

    // Group articles with date separators
    const listData = useMemo<ListItem[]>(() => {
        const result: ListItem[] = [];
        let lastDateKey = '';

        news.forEach((article) => {
            const dateKey = getDateKey(article.created_at);
            if (dateKey !== lastDateKey) {
                result.push({
                    type: 'date',
                    label: formatDateLabel(article.created_at),
                    key: `date-${dateKey}`,
                });
                lastDateKey = dateKey;
            }
            result.push({
                type: 'article',
                article,
                key: article.id,
            });
        });

        return result;
    }, [news]);

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'date') {
            return <DateSeparator label={item.label} />;
        }
        return <NewsCard article={item.article} />;
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={listData}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No news articles yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8E8E8',
    },
    listContent: {
        padding: 10,
        paddingBottom: 100,
    },
    // Date separator styles
    dateSeparatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        paddingHorizontal: 20,
    },
    dateSeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#D0D0D0',
    },
    dateSeparatorBadge: {
        backgroundColor: '#D9E8EC',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginHorizontal: 10,
    },
    dateSeparatorText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4A90A4',
    },
    // Card styles
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    imageContainer: {
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: 200,
    },
    playOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }],
        width: 50,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#FFF',
        fontSize: 20,
        marginLeft: 4,
    },
    contentContainer: {
        padding: 12,
    },
    headline: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    contentText: {
        fontSize: 14,
        color: '#303030',
        lineHeight: 20,
    },
    boldText: {
        fontWeight: 'bold',
    },
    linkContainer: {
        marginTop: 12,
    },
    linkLabel: {
        fontSize: 14,
        color: '#303030',
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#303030',
    },
    linkUrl: {
        fontSize: 14,
        color: '#4A90A4',
        textDecorationLine: 'underline',
    },
    timestamp: {
        fontSize: 11,
        color: '#8696A0',
        textAlign: 'right',
        marginTop: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#8696A0',
        fontSize: 16,
    },
});
