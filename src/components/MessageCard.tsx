import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FormattedText } from './FormattedText';
import { SavedIcon } from './Icons';

interface MessageCardProps {
  title?: string;
  content: string;
  image_url?: string | null;
  link_url?: string | null;
  link_text?: string;
  created_at: string;
  author_name?: string;
  reactions?: React.ReactNode;
  onLongPress?: () => void;
  onPress?: () => void;
  viewCount?: number;
  showViewCount?: boolean;
  variant?: 'default' | 'announcement' | 'sponsored';
  isSelected?: boolean;
  isSaved?: boolean;
  showSaveButton?: boolean;
  onToggleSave?: () => void;
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const MessageCard = ({
  title,
  content,
  image_url,
  link_url,
  link_text = 'CBN UNFILTERED',
  created_at,
  author_name = 'CBN admin',
  reactions,
  onLongPress,
  onPress,
  viewCount,
  showViewCount,
  variant = 'default',
  isSelected = false,
  isSaved = false,
  showSaveButton = false,
  onToggleSave,
}: MessageCardProps) => {
  const { theme } = useTheme();

  const handleLinkPress = async () => {
    if (link_url) {
      try {
        await Linking.openURL(link_url);
      } catch (error) {
        console.warn('Unable to open URL', error);
      }
    }
  };

  const cardBgColor = theme.colors.cardBackground || theme.colors.surface;
  const textColor = theme.colors.text;
  const secondaryTextColor = theme.colors.textSecondary;
  const isAnnouncement = variant === 'announcement';
  const isSponsored = variant === 'sponsored';

  const styles = StyleSheet.create({
    container: {
      backgroundColor: cardBgColor,
      borderRadius: 12,
      padding: 4,
      marginVertical: 6,
      borderWidth: isSelected ? 1 : 0,
      borderColor: isSelected ? theme.colors.primary : 'transparent',
    },
    contentContainer: {
      padding: 16,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 4,
    },
    avatar: {
      width: 31,
      height: 29,
      borderRadius: 6,
      marginRight: 8,
    },
    headerTextContainer: {
      flex: 1,
    },
    adminName: {
      fontSize: 12,
      fontWeight: '600',
      color: secondaryTextColor,
      fontFamily: 'Inter',
    },
    sponsoredBadge: {
      backgroundColor: '#000000',
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 100,
    },
    sponsoredText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      fontFamily: 'Inter',
    },
    saveButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isSaved ? theme.colors.primary + '1A' : 'transparent',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isSaved ? theme.colors.primary : theme.colors.border,
      marginLeft: 8,
    },
    textContent: {
      ...theme.typography.postTextRegular,
      color: textColor,
      marginTop: 4,
      marginBottom: 10,
      paddingHorizontal: 10,
    },
    imageContainer: {
      width: '100%',
      height: 239,
      borderRadius: 10,
      overflow: 'hidden',
      marginTop: 4,
      marginBottom: 10,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    linkContainer: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginVertical: 4,
    },
    linkTitle: {
      ...theme.typography.postTextBold,
      color: textColor,
      marginBottom: 4,
    },
    linkUrl: {
      ...theme.typography.postLink,
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: 10,
      paddingTop: 6,
      paddingBottom: 8,
      gap: 10,
    },
    reactionsContainer: {
      flex: 1,
      alignItems: 'flex-start',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaText: {
      fontSize: 10,
      fontWeight: '600',
      color: secondaryTextColor,
      fontFamily: 'Inter',
    },
    announcementTitle: {
      ...theme.typography.postTextBold,
      color: textColor,
      marginTop: 4,
      marginBottom: 8,
      paddingHorizontal: 10,
    },
    announcementBody: {
      ...theme.typography.postTextRegular,
      color: textColor,
      paddingHorizontal: 10,
      paddingBottom: 8,
    },
  });

  const renderAnnouncement = () => (
    <>
      {title ? <FormattedText text={title} style={styles.announcementTitle} /> : null}
      <FormattedText text={content} style={styles.announcementBody} />
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        isAnnouncement && { borderLeftWidth: 3, borderLeftColor: theme.colors.primary },
        isSponsored && { borderColor: theme.colors.primary, borderWidth: 1 },
        isSelected && { opacity: 0.9 },
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/CBN_Logo-removebg-preview.png')}
            style={styles.avatar}
            resizeMode="contain"
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.adminName}>{author_name}</Text>
          </View>
          {variant === 'sponsored' && (
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredText}>Sponsored Post</Text>
            </View>
          )}
          {showSaveButton && (
            <Pressable
              style={styles.saveButton}
              onPress={(event) => {
                event.stopPropagation?.();
                onToggleSave?.();
              }}
            >
              <SavedIcon
                size={16}
                color={isSaved ? theme.colors.primary : secondaryTextColor}
                strokeWidth={1.8}
              />
            </Pressable>
          )}
        </View>

        {isAnnouncement ? (
          renderAnnouncement()
        ) : (
          <>
            <FormattedText text={content} style={styles.textContent} />

            {image_url && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: image_url }}
                  style={styles.image}
                />
              </View>
            )}

            {link_url && (
              <View style={styles.linkContainer}>
                <Text style={styles.linkTitle}>Link to {link_text}</Text>
                <Pressable onPress={handleLinkPress}>
                  <Text style={styles.linkUrl}>{link_url}</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        <View style={styles.footerRow}>
          <View style={styles.reactionsContainer}>{reactions ? reactions : null}</View>
          <View style={styles.metaRow}>
            {showViewCount ? (
              <Text style={styles.metaText}>👁 {viewCount || 0}</Text>
            ) : null}
            <Text style={styles.metaText}>{formatTime(created_at)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};
