import { Linking } from 'react-native';

/**
 * Opens a URL only if it uses a safe scheme (https/http).
 * Prevents deep link hijacking, intent-based attacks, and javascript: execution.
 */
export const safeOpenURL = async (url: string): Promise<void> => {
  if (!url) return;

  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(trimmed);
    if (canOpen) {
      await Linking.openURL(trimmed);
    }
  } catch (error) {
    console.warn('Unable to open URL', error);
  }
};
