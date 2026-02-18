import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FormattedText } from './FormattedText';
import { FilterIcon } from './Icons';
import { LinkPreview } from './LinkPreview';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';

interface MessageCardProps {
  title?: string;
  content: string;
  image_url?: string | null;
  video_url?: string | null;
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
  video_url,
  link_url,
  link_text,
  created_at,
  author_name = 'CBN Admin',
  reactions,
  onLongPress,
  onPress,
  viewCount,
  showViewCount,
  variant = 'default',
  isSelected = false,
}: MessageCardProps) => {
  const { theme } = useTheme();
  const [imageAspectRatio, setImageAspectRatio] = useState(1.5); // Default to 3:2
  const [videoAspectRatio, setVideoAspectRatio] = useState(1.77); // Default to 16:9

  // Image aspect ratio handling handled by expo-image onLoad

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
      paddingTop: 0,
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

    textContent: {
      ...theme.typography.postTextRegular,
      color: textColor,
      marginTop: 4,
      marginBottom: 10,
      paddingHorizontal: 10,
    },
    imageContainer: {
      width: '100%',
      // height removed to allow aspectRatio to drive it
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 4,
      marginBottom: 10,
      backgroundColor: theme.dark ? '#1E1E1E' : '#F2F2F7',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    video: {
      width: '100%',
      // height removed
      borderRadius: 12,
      marginTop: 4,
      marginBottom: 10,
      backgroundColor: '#000', // Black background for video
      position: 'relative',
      overflow: 'hidden',
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    playButtonBlur: {
      width: 50,
      height: 50,
      borderRadius: 25,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    playIcon: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 15,
      borderTopWidth: 10,
      borderBottomWidth: 10,
      borderLeftColor: '#FFFFFF',
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      marginLeft: 4,
    },
    linkContainer: {
      paddingHorizontal: 10,
      marginBottom: 4,
    },
    linkTitle: {
      ...theme.typography.postTextBold,
      color: textColor,
      marginBottom: 4,
    },
    linkUrl: {
      ...theme.typography.postLink,
      color: '#20B65E',
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


  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
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

        </View>

        {isAnnouncement && title ? <FormattedText text={title} style={styles.announcementTitle} /> : null}

        {image_url && (
          <View style={[styles.imageContainer, { aspectRatio: imageAspectRatio }]}>
            <Image
              source={image_url}
              style={styles.image}
              contentFit="cover"
              transition={200}
              onError={(e) => console.log('[MessageCard] ExpoImage Error:', e.error, image_url)}
              onLoad={(e) => {
                console.log('[MessageCard] ExpoImage Loaded:', image_url);
                if (e.source.width && e.source.height) {
                  setImageAspectRatio(e.source.width / e.source.height);
                }
              }}
            />
          </View>
        )}

        {video_url && (
          <View style={[styles.video, { aspectRatio: videoAspectRatio }]}>
            <Video
              source={{ uri: video_url }}
              style={StyleSheet.absoluteFill}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              shouldPlay={false}
              onReadyForDisplay={(videoData) => {
                if (videoData.naturalSize.width && videoData.naturalSize.height) {
                  setVideoAspectRatio(videoData.naturalSize.width / videoData.naturalSize.height);
                }
              }}
            />
            <View style={styles.videoOverlay} pointerEvents="none">
              <BlurView intensity={30} tint="light" style={styles.playButtonBlur}>
                <View style={styles.playIcon} />
              </BlurView>
            </View>
          </View>
        )}

        <FormattedText text={content} style={isAnnouncement ? styles.announcementBody : styles.textContent} />

        {link_url && (
          <View style={styles.linkContainer}>
            {link_text && <Text style={styles.linkTitle}>{link_text}</Text>}
            <Pressable onPress={handleLinkPress}>
              <Text style={styles.linkUrl}>{link_url}</Text>
            </Pressable>
          </View>
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
