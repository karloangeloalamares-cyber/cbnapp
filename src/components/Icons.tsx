import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * News/Newspaper Icon
 * Used for the News tab in NavigationBar
 */
export const NewsIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="7" y1="9" x2="17" y2="9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="7" y1="13" x2="17" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="7" y1="17" x2="13" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/**
 * Announcement/Megaphone Icon
 * Used for the Announcements tab in NavigationBar
 */
export const AnnouncementIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11.5 5.5L7 9.5H4.5C3.67157 9.5 3 10.1716 3 11V13C3 13.8284 3.67157 14.5 4.5 14.5H7L11.5 18.5V5.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 14.5V17.5C7 18.3284 7.67157 19 8.5 19C9.32843 19 10 18.3284 10 17.5V16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 8C16.1046 8 17 9.79086 17 12C17 14.2091 16.1046 16 15 16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Notifications/Bell Icon
 * Used for the Notifications tab in NavigationBar
 */
export const NotificationIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="19" cy="5" r="3" fill={color} stroke="none" />
  </Svg>
);

/**
 * Saved/Bookmark Icon
 * Used for the Saved tab in NavigationBar
 */
export const SavedIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="7 10 12 15 17 10"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="12"
      y1="15"
      x2="12"
      y2="3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Settings/Gear Icon
 * Used for the Settings tab in NavigationBar
 */
export const SettingsIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Moon Icon
 * Used for dark mode preferences
 */
export const MoonIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 14.5A8.5 8.5 0 1 1 9.5 4A7 7 0 0 0 20 14.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Logout Icon
 * Used for account actions
 */
export const LogoutIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 3H6C4.9 3 4 3.9 4 5V19C4 20.1 4.9 21 6 21H14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 12H21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18 8L22 12L18 16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Home Icon variant
 * Alternative icon for News tab
 */
export const HomeIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 10L12 3L21 10V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path d="M9 22V12H15V22" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </Svg>
);

/**
 * Google "G" Icon (Multi-colored)
 */
export const GoogleIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

/**
 * Forward/Share Icon
 */
export const ForwardIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="16 6 12 2 8 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="12"
      y1="2"
      x2="12"
      y2="15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Copy/Clipboard Icon
 */
export const CopyIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="9"
      y="9"
      width="13"
      height="13"
      rx="2"
      ry="2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Filter/Menu Icon (3 lines of decreasing width)
// Used beside the avatar in MessageCard header
export const FilterIcon = ({ size = 24, color = '#8696A0', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.63849 4.75H21.1385"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M5.63849 12H18.1385"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M8.63849 19.25H15.1385"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Edit/Pencil Icon
 * Used for editing posts in admin options
 */
export const EditIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Delete/Trash Icon
 * Used for deleting posts in admin options
 */
export const DeleteIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// Stats/Chart Icon (3 vertical lines)
export const StatsIcon = ({ size = 24, color = '#8696A0', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/**
 * Plus/Add Icon
 * Used for the Admin FAB
 */
export const PlusIcon = ({ size = 24, color = '#FFFFFF', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/**
 * Composer Gallery Icon (From Design)
 * ViewBox tailored to frame the path from the provided global SVG
 */
export const ComposerGalleryIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="31 14.5 24 24" fill="none">
    <Path d="M52 25.5352C51.6697 25.5119 51.3362 25.5 51 25.5C47.1879 25.5 43.7317 27.0236 41.207 29.4951M41.207 29.4951C39.1017 28.2285 36.6359 27.5 34 27.5M41.207 29.4951C39.5315 31.1353 38.2663 33.1931 37.5798 35.5M36 17.5H50C51.1046 17.5 52 18.3954 52 19.5V33.5C52 34.6046 51.1046 35.5 50 35.5H36C34.8954 35.5 34 34.6046 34 33.5V19.5C34 18.3954 34.8954 17.5 36 17.5ZM39 21.5C39.3333 21.5 40 21.7 40 22.5C40 23.3 39.3333 23.5 39 23.5C38.6667 23.5 38 23.3 38 22.5C38 21.7 38.6667 21.5 39 21.5Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/**
 * Composer GIF Icon (From Design)
 */
export const ComposerGifIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="65 14.5 24 24" fill="none">
    <Path d="M70.75 26.8676C70.75 28.5113 71.7095 29.5 73.3404 29.5C74.7904 29.5 75.7672 28.638 75.7672 27.3662V27.0155C75.7672 26.4789 75.5176 26.238 74.9497 26.238H73.8954C73.5168 26.238 73.3145 26.4113 73.3145 26.7282C73.3145 27.0493 73.5211 27.2268 73.8954 27.2268H74.4247V27.4718C74.4247 28 74.0116 28.3549 73.3963 28.3549C72.6046 28.3549 72.17 27.8268 72.17 26.8634V26.1662C72.17 25.1901 72.596 24.6789 73.4092 24.6789C73.9643 24.6789 74.287 25.0085 74.6355 25.3507C74.7603 25.4732 74.8894 25.5282 75.0572 25.5282C75.3972 25.5282 75.6338 25.3 75.6338 24.9662C75.6338 24.6324 75.3799 24.269 74.9927 23.9944C74.5624 23.6775 73.9729 23.5 73.3059 23.5C71.7225 23.5 70.75 24.5014 70.75 26.0986V26.8676Z" fill={color} />
    <Path d="M77.3894 29.4155C77.8412 29.4155 78.0951 29.1451 78.0951 28.6634V24.3155C78.0951 23.838 77.8369 23.5634 77.3808 23.5634C76.9247 23.5634 76.6708 23.8338 76.6708 24.3155V28.6634C76.6708 29.1408 76.9333 29.4155 77.3894 29.4155Z" fill={color} />
    <Path d="M79.9626 29.4155C80.4101 29.4155 80.6596 29.1451 80.6596 28.6634V27.2014H82.4669C82.8025 27.2014 83.0306 26.9817 83.0306 26.6563C83.0306 26.331 82.8068 26.1113 82.4669 26.1113H80.6596V24.7254H82.6863C83.0133 24.7254 83.25 24.4971 83.25 24.1718C83.25 23.8422 83.0133 23.6056 82.6863 23.6056H80.0572C79.5237 23.6056 79.2354 23.8887 79.2354 24.4042V28.6634C79.2354 29.1366 79.5022 29.4155 79.9626 29.4155Z" fill={color} />
    <Path d="M82.25 18.25H71.75C70.0932 18.25 68.75 19.5932 68.75 21.25V31.75C68.75 33.4069 70.0932 34.75 71.75 34.75H82.25C83.9069 34.75 85.25 33.4069 85.25 31.75V21.25C85.25 19.5932 83.9069 18.25 82.25 18.25Z" stroke={color} strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="round" />
  </Svg>
);

/**
 * Composer Video/Camera Icon (From Design)
 */
export const ComposerVideoIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="99 14.5 24 24" fill="none">
    <Path d="M116 26.5V22.5C116 21.3954 115.105 20.5 114 20.5H104C102.895 20.5 102 21.3954 102 22.5V30.5C102 31.6046 102.895 32.5 104 32.5H114C115.105 32.5 116 31.6046 116 30.5V26.5ZM116 26.5L120 22.5V30.5L116 26.5Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/**
 * Composer Chart/Poll Icon (From Design)
 */
export const ComposerChartIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="132.5 14.25 24 24" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M144.615 17.4L146.936 17.4C147.459 17.4 147.759 17.4 148.018 17.4204C151.254 17.6751 153.825 20.2457 154.08 23.4822C154.1 23.7409 154.1 24.0407 154.1 24.5642V24.6376C154.1 25.438 154.1 25.8771 154.07 26.2532C153.7 30.9609 149.961 34.6999 145.253 35.0704C144.877 35.1 144.438 35.1 143.638 35.1H143.252C142.554 35.1 142.154 35.1001 141.81 35.0639C138.711 34.7381 136.262 32.2891 135.936 29.1899C135.9 28.8457 135.9 28.4458 135.9 27.7478L135.9 26.1155C135.9 24.1494 135.9 23.0216 136.184 22.0842C136.824 19.9748 138.475 18.3241 140.584 17.6842C141.522 17.3999 142.649 17.3999 144.615 17.4ZM144.75 18.6C142.613 18.6 141.678 18.6066 140.932 18.8326C139.207 19.3561 137.856 20.7066 137.333 22.4325C137.107 23.1775 137.1 24.1129 137.1 26.25V27.7C137.1 28.4583 137.101 28.7909 137.13 29.0645C137.396 31.6002 139.4 33.6039 141.936 33.8704C142.209 33.8992 142.542 33.9 143.3 33.9H143.6C144.447 33.9 144.836 33.8996 145.159 33.8741C145.295 33.8634 145.4 33.7476 145.399 33.6067C145.399 33.5731 145.399 33.5396 145.399 33.506C145.397 32.7486 145.394 31.9839 145.457 31.224C145.514 30.5199 145.633 29.9382 145.901 29.4117C146.342 28.5461 147.046 27.8424 147.912 27.4014C148.438 27.1331 149.02 27.014 149.724 26.9565C150.548 26.8892 151.376 26.8929 152.198 26.8975C152.443 26.8988 152.533 26.8971 152.61 26.8611C152.677 26.8298 152.745 26.7682 152.783 26.7051C152.827 26.6321 152.837 26.5507 152.859 26.3269C152.865 26.2711 152.87 26.2152 152.874 26.1591C152.9 25.836 152.9 25.4472 152.9 24.6C152.9 24.0314 152.9 23.7819 152.883 23.5764C152.675 20.9283 150.572 18.8251 147.924 18.6167C147.718 18.6005 147.469 18.6 146.9 18.6H144.75ZM151.975 28.0978C151.254 28.0945 150.535 28.0943 149.822 28.1525C149.192 28.204 148.786 28.3029 148.456 28.4706C147.817 28.7966 147.297 29.3167 146.971 29.9565C146.803 30.2856 146.704 30.6918 146.653 31.3217C146.613 31.8079 146.603 32.3967 146.601 33.1526C146.6 33.2574 146.6 33.3289 146.605 33.3836C146.61 33.4369 146.62 33.4632 146.631 33.4811C146.656 33.5215 146.703 33.556 146.749 33.5681C146.771 33.5736 146.798 33.5744 146.847 33.564C146.898 33.5533 146.962 33.5329 147.057 33.5026C149.466 32.7341 151.398 30.913 152.318 28.5765C152.356 28.4786 152.382 28.412 152.397 28.359C152.412 28.3077 152.412 28.2795 152.408 28.2577C152.398 28.2093 152.364 28.1597 152.323 28.1323C152.305 28.1204 152.278 28.1104 152.221 28.1046C152.163 28.0987 152.086 28.0983 151.975 28.0978Z" fill={color} />
  </Svg>
);

/**
 * Composer Mic Icon (From Design)
 */
export const ComposerMicIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="347 14.5 24 24" fill="none">
    <Path d="M362 19.5C362 17.8431 360.657 16.5 359 16.5C357.343 16.5 356 17.8431 356 19.5V25.5C356 27.1569 357.343 28.5 359 28.5C360.657 28.5 362 27.1569 362 25.5V19.5Z" stroke={color} strokeWidth={1.5} />
    <Path d="M352 24.5V25.5C352 29.366 355.134 32.5 359 32.5C362.866 32.5 366 29.366 366 25.5V24.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M359 32.5V36.5M359 36.5H356M359 36.5H362" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/**
 * Send Plane/Arrow Icon
 */
export const SendPlaneIcon = ({ size = 24, color = '#FFFFFF', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="22" y1="2" x2="11" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 2 15 22 11 13 2 9 22 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
