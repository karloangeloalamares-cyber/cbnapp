# CBN App Redesign Documentation

**Last Updated:** February 12, 2026  
**Status:** Phase 1 Complete ✅ | Phase 2 Complete ✅  
**Tech Stack:** React Native + Expo, TypeScript, Supabase

## 🆕 Latest Updates

### Session 2 - SVG Icon Implementation
- ✅ Installed `react-native-svg` dependency
- ✅ Created 6 professional SVG icon components
- ✅ Integrated icons into NavigationBar
- ✅ Icons auto-respond to active/inactive state
- ✅ Full dark/light theme support for icons
- ✅ Updated documentation with icon usage guide

---

## 📋 Project Overview

The CBN App is being redesigned to match modern Figma designs. This document guides developers through the redesign phases and provides clear patterns for implementation.

### Current Progress
- ✅ Phase 1: Design System & Core Components
- ✅ Icons: Real SVG icons implemented
- ✅ Phase 2: Screen Integration (complete)
- ⏹️ Phase 3: Navigation & Polish
- ⏹️ Phase 4: Testing & Deployment

---

## 🎯 Phase 1: Completed (Design System)

### Theme & Design Tokens

**File:** `src/theme.ts`

The theme has been updated with exact Figma specifications:

#### Dark Mode (Primary)
```typescript
colors: {
    background: '#0B141A',      // Very dark background
    surface: '#1C1C1E',         // Card backgrounds
    text: '#FFFFFF',            // Primary text
    textSecondary: '#BDBDBD',   // Secondary text
    primary: '#20B65E',         // CBN Green (links, buttons)
    cardBackground: '#1C1C1E',
}
```

#### Light Mode
```typescript
colors: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#20B65E',
    cardBackground: '#FFFFFF',
}
```

#### Typography (Inter Font Family)
- **Admin Title:** 12px, Semi Bold (600)
- **Post Text Regular:** 16px, Medium (500), line-height 18
- **Post Text Bold:** 16px, Bold (700), line-height 18
- **Post Link:** 16px, Regular (400), line-height 23, Color: `#20B65E`

### New Components Created

#### 1. **MessageCard** (`src/components/MessageCard.tsx`)
Displays posts with multiple variants:

**Props:**
```typescript
interface MessageCardProps {
  content: string;                           // Main text
  image_url?: string | null;                 // Optional image
  link_url?: string | null;                  // Optional link
  link_text?: string;                        // Link label (default: "Link to CBN UNFILTERED")
  created_at: string;                        // Timestamp
  author_name?: string;                      // Display name (default: "CBN Admin")
  reactions?: React.ReactNode;               // Reaction indicators
  onLongPress?: () => void;                  // Long press handler
  onPress?: () => void;                      // Tap handler
  viewCount?: number;                        // View count for analytics
  showViewCount?: boolean;                   // Show view count badge
  variant?: 'default' | 'announcement' | 'sponsored';  // Card type
  isSelected?: boolean;                      // Selection state
}
```

**Usage:**
```tsx
<MessageCard
  content="Prime Minister Benjamin Netanyahu signed Israel's accession to the Peace Council..."
  image_url="https://..."
  link_url="https://chat.whatsapp.com/JJe2fBqAa5G9T0QHIiBTGy"
  link_text="CBN UNFILTERED"
  created_at={new Date().toISOString()}
  author_name="CBN Admin"
  variant="default"
  onPress={() => navigation.navigate('NewsDetail')}
/>
```

**Key Features:**
- ✅ Dark/Light mode support
- ✅ Responsive sizing
- ✅ Multiple variants (default, announcement, sponsored)
- ✅ Image support with rounded corners (10px)
- ✅ Link detection and formatting
- ✅ Timestamp formatting
- ✅ Selection state for multi-select

#### 2. **Header** (`src/components/Header.tsx`)
Top navigation header component

**Props:**
```typescript
interface HeaderProps {
  title?: string;              // Header title (default: "CBN Unfiltered")
  avatar?: string;             // Avatar image URL
  onAvatarPress?: () => void;  // Avatar tap handler
  onMenuPress?: () => void;    // Menu button handler
}
```

**Usage:**
```tsx
<Header
  title="CBN Unfiltered"
  avatar={user?.avatar_url}
  onAvatarPress={() => navigation.navigate('Profile')}
/>
```

#### 3. **NavigationBar** (`src/components/NavigationBar.tsx`) ✅ UPDATED WITH REAL ICONS
- 5-tab bottom navigation
- Real SVG icons (not placeholders)
- Active state indicators with primary color
- Rounded button design from Figma
- Theme-aware color switching

**SVG Icons Included:**
- **NewsIcon** - Newspaper for News tab
- **AnnouncementIcon** - Megaphone for Announcements tab
- **NotificationIcon** - Bell for Notifications tab
- **SavedIcon** - Bookmark for Saved items tab
- **SettingsIcon** - Gear for Settings tab

**Icon Features:**
```tsx
interface IconProps {
  size?: number;        // Default: 24
  color?: string;       // Any hex color
  strokeWidth?: number; // Default: 2
}

// Usage:
<NewsIcon size={24} color="#20B65E" strokeWidth={1.5} />
```

**Icons File:** `src/components/Icons.tsx`

#### 4. **Icons** (`src/components/Icons.tsx`) ✅ NEW - SVG ICON LIBRARY

Professional SVG icon components built with `react-native-svg`.

**Available Icons:**
- **NewsIcon** - Newspaper representation for News tab
- **AnnouncementIcon** - Megaphone symbol for Announcements tab
- **NotificationIcon** - Bell with notification indicator
- **SavedIcon** - Bookmark design for Saved items
- **SettingsIcon** - Gear/cog symbol for Settings
- **HomeIcon** - Alternative home icon

**Icon Props:**
```typescript
interface IconProps {
  size?: number;        // Icon size (default: 24)
  color?: string;       // Hex color (default: #8696A0)
  strokeWidth?: number; // Line thickness (default: 2)
}
```

**Usage Examples:**
```tsx
import { NewsIcon, NotificationIcon, SettingsIcon } from '../components/Icons';

// Standalone usage
<NewsIcon size={24} color="#20B65E" strokeWidth={1.5} />

// In NavigationBar (colors auto-managed)
// Active icons: green (#20B65E)
// Inactive icons: gray (#8696A0 dark / #6B7280 light)
<NavigationBar />
```

**Features:**
- ✅ Vector-based (scalable without quality loss)
- ✅ Responsive to app theme
- ✅ Customizable size/color/stroke
- ✅ Used in NavigationBar with automatic color management
- ✅ Built with industry-standard `react-native-svg`

**Dependencies Added:**
- `react-native-svg@^13.x` - For SVG rendering in React Native

---

## 🔄 Phase 2: Screen Integration

### Updated Screens

All screens now use the Figma design system with `useTheme()`, `createStyles(theme)`, Inter font, and theme color tokens.

#### MainNavigator (`src/navigation/MainNavigator.tsx`) ✅ UPDATED
- ✅ All 5 tabs wrapped with consistent `Header` component
- ✅ Each tab shows CBN logo + tab title + user avatar
- ✅ `NavigationBar` with SVG icons at the bottom
- ✅ Notification badge with real-time unread count

#### NewsScreen (`src/screens/NewsScreen.tsx`) ✅ UPDATED
- ✅ Uses `MessageCard` component (replaced `MessageBubble`)
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ Date separators, reactions, saved items, selection
- ✅ Admin Composer with formatting toolbar

#### MessageBoardScreen (`src/screens/MessageBoardScreen.tsx`) ✅ UPDATED
- ✅ Uses `MessageCard` with `variant="announcement"`
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ Embedded mode for tab usage (header provided by MainNavigator)
- ✅ Admin Composer with formatting toolbar

#### NotificationsScreen (`src/screens/NotificationsScreen.tsx`) ✅ UPDATED
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ Uses SVG icons (NewsIcon, AnnouncementIcon)
- ✅ Header provided by MainNavigator tab wrapper
- ✅ Unread indicators with primary color

#### SavedScreen (`src/screens/SavedScreen.tsx`) ✅ UPDATED
- ✅ Uses `MessageCard` for saved news and announcements
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ Header provided by MainNavigator tab wrapper
- ✅ SavedIcon in empty state

#### SettingsScreen (`src/screens/SettingsScreen.tsx`) ✅ UPDATED
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ SVG icons (MoonIcon, LogoutIcon)
- ✅ Header provided by MainNavigator tab wrapper
- ✅ Dark mode toggle, profile display, logout

#### NewsDetailScreen (`src/screens/NewsDetailScreen.tsx`) ✅ UPDATED
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ Uses `theme.typography` tokens
- ✅ Own header with back navigation (stack screen)

#### AnnouncementDetailScreen (`src/screens/AnnouncementDetailScreen.tsx`) ✅ UPDATED
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ Uses `theme.typography` tokens
- ✅ Own header with back navigation (stack screen)

#### ProfileScreen (`src/screens/ProfileScreen.tsx`) ✅ UPDATED
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ SettingsIcon from Icons.tsx
- ✅ Own header with back navigation (stack screen)

#### LoginScreen (`src/screens/LoginScreen.tsx`) ✅ UPDATED
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ CBN logo, Inter font throughout

#### SignUpScreen (`src/screens/SignUpScreen.tsx`) ✅ UPDATED
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ Password strength validation, Inter font

#### ForgotPasswordScreen (`src/screens/ForgotPasswordScreen.tsx`) ✅ UPDATED
- ✅ Uses `useTheme()` + `createStyles(theme)` pattern
- ✅ CBN logo, Inter font

---

## 🎨 Design Patterns & Best Practices

### Using the Theme System

**Pattern for Component Styling:**
```tsx
import { useTheme } from '../context/ThemeContext';

export const MyComponent = () => {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    },
    text: {
      color: theme.colors.textSecondary,
      fontFamily: 'Inter',
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Content</Text>
    </View>
  );
};
```

### Color Usage

**Always use theme colors:**
```tsx
// ✅ GOOD
backgroundColor: theme.colors.surface
color: theme.colors.text

// ❌ AVOID
backgroundColor: '#1C1C1E'
color: '#FFFFFF'
```

### Typography

**Use consistent sizes from theme:**
```tsx
// Typography shortcuts defined in theme.ts:
theme.typography.adminTitle      // 12px Semi Bold
theme.typography.postTextRegular // 16px Medium
theme.typography.postTextBold    // 16px Bold
theme.typography.postLink        // 16px Regular

// Apply to Text components:
<Text style={{
  fontSize: theme.typography.postTextRegular.fontSize,
  fontWeight: theme.typography.postTextRegular.fontWeight,
}}>
  Content
</Text>
```

### Responsive Sizing

**Use `useWindowDimensions` for responsive layout:**
```tsx
import { useWindowDimensions } from 'react-native';

export const MyComponent = () => {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 32, 384); // Max 384px, 16px padding
  
  return <View style={{ width: cardWidth }} />;
};
```

---

## 🔧 Figma to React Native Conversion Guidelines

### Converting Figma Measurements

| Figma Unit | React Native |
|-----------|-------------|
| px        | Use directly as number |
| Corner Radius | `borderRadius` |
| Opacity | `opacity` property |
| Shadows | `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` |
| Width/Height | Use responsive sizing |

### Converting Colors

Figma hex colors convert directly:
```
Figma #20B65E → React Native '#20B65E'
```

### Converting Typography

Figma Font Properties → React Native:
```
Font: Inter → fontFamily: 'Inter'
Weight: 600 → fontWeight: '600'
Size: 16px → fontSize: 16
Line Height: 18px → lineHeight: 18
```

---

## 📱 Screen Implementation Checklist

For each screen update, follow this checklist:

- [ ] Import `useTheme` hook
- [ ] Replace hardcoded colors with `theme.colors.*`
- [ ] Apply Figma typography (font family "Inter")
- [ ] Update component backgrounds to match design
- [ ] Test in both dark and light modes
- [ ] Verify spacing matches Figma (12px, 16px, 24px standard)
- [ ] Check border radius consistency (12px standard for cards)
- [ ] Test on iOS and Android
- [ ] Verify responsiveness on different screen sizes
- [ ] Update component to use `MessageCard` if displaying posts

---

## 🚀 Next Steps (Phase 2)

### Immediate Tasks
1. **Update NewsScreen.tsx**
   - Replace `MessageBubble` with `MessageCard`
   - Apply theme colors throughout
   - Test with real data

2. **Update MessageBoardScreen.tsx**
   - Refactor announcement display
   - Use `MessageCard` with announcement variant
   - Apply Figma design tokens

3. **Update NotificationsScreen.tsx**
   - Apply theme colors
   - Update typography

4. **Integrate NavigationBar into screens** ✅ READY
   - SVG icons are complete and ready to use
   - Add NavigationBar to bottom of relevant screens
   - Connect navigation to actual screens

### Medium-term Tasks
1. Replace all remaining hardcoded colors
2. Implement bottom tab navigation with NavigationBar on all screens
3. Test all screens in both themes
4. Create additional UI components as needed

### Testing Checklist
- [ ] Visual regression testing (screenshot comparison)
- [ ] Theme toggle testing (dark/light switch)
- [ ] SVG icon rendering on all screen sizes
- [ ] Responsive layout testing
- [ ] Cross-platform testing (iOS/Android)
- [ ] Performance testing (no layout jank)
- [ ] NavigationBar interaction testing

---

## 📁 File Structure Reference

```
src/
├── components/
│   ├── Header.tsx              ✅ Figma header with safe area + logo
│   ├── Icons.tsx               ✅ SVG Icon Library (6 icons)
│   ├── MessageCard.tsx         ✅ Figma-compliant post card
│   ├── NavigationBar.tsx       ✅ 5-tab bottom nav with SVG icons
│   ├── Composer.tsx            ✅ Admin text input with formatting
│   ├── FormattedText.tsx       ✅ Markdown-style text rendering
│   ├── FormattingHeader.tsx    ✅ B/I/S/M formatting toolbar
│   └── SelectionHeader.tsx     ✅ Multi-select action bar
├── navigation/
│   └── MainNavigator.tsx       ✅ Tab navigator with Header wrappers
├── screens/
│   ├── NewsScreen.tsx          ✅ MessageCard + theme
│   ├── MessageBoardScreen.tsx  ✅ MessageCard announcement variant
│   ├── NotificationsScreen.tsx ✅ SVG icons + theme
│   ├── SavedScreen.tsx         ✅ MessageCard + theme
│   ├── SettingsScreen.tsx      ✅ SVG icons + theme
│   ├── NewsDetailScreen.tsx    ✅ Theme typography
│   ├── AnnouncementDetailScreen.tsx ✅ Theme typography
│   ├── ProfileScreen.tsx       ✅ Theme + SettingsIcon
│   ├── LoginScreen.tsx         ✅ Theme
│   ├── SignUpScreen.tsx        ✅ Theme
│   ├── ForgotPasswordScreen.tsx ✅ Theme
│   └── AdminPostScreen.tsx
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx        ✅ Dark/Light mode provider
├── theme.ts                    ✅ Figma tokens (colors, typography, spacing)
└── types/
    └── index.ts
```

---

## 🚨 Common Issues & Solutions

### Issue: Components not respecting theme
**Solution:** Ensure component imports `useTheme` and calls it:
```tsx
const { theme } = useTheme();
```

### Issue: Colors look different in dark mode
**Solution:** Check that both light and dark theme objects have the same color keys

### Issue: Text rendering incorrectly
**Solution:** Verify `fontFamily: 'Inter'` is set and font is available on device

### Issue: Navigation items not showing
**Solution:** Ensure NavigationBar is placed in a parent that can accommodate it (usually bottom of screen)

---

## 🔗 Figma Reference

**Figma File:** CBN-Shared Design System  
**File Key:** `cc5bhBKyK9c6Y1VAoUBmVk`

### Key Design Frames
- Components Frame: `3:841` (Message Cards, Navbar, Headers)
- Design Page: `0:1` (All screen mockups)

**Color Variables in Figma:**
- Background: `#0B141A`
- Card Surface: `#1C1C1E`
- Primary Text: `#FFFFFF`
- Secondary Text: `#BDBDBD`
- Accent Green: `#20B65E`

---

## 📞 Questions & Troubleshooting

### Q: How do I add a new screen component?
A: Follow the pattern from HomeScreen:
1. Import `useTheme`
2. Create styles as a function: `const styles = (theme) => StyleSheet.create({...})`
3. Use `theme.colors` instead of hardcoded values
4. Apply theme typography from `theme.typography`

### Q: Can I use the old MessageBubble component?
A: It still works but should be migrated to MessageCard for consistency. MessageCard is the newer, Figma-compliant component.

### Q: How do I implement dark mode switching?
A: Use the existing `ThemeContext.tsx` which provides `toggleTheme()`. It's already integrated in the app.

---

## ✅ Verification Checklist

Before marking a screen as "fully redesigned," verify:
- [ ] All colors use `theme.colors`
- [ ] Typography uses Inter font and matches theme specs
- [ ] Spacing is consistent (multiples of 4, 8, 12, 16, 24)
- [ ] Border radius is 12px for cards
- [ ] Works in both light and dark modes
- [ ] Responsive on mobile sizes
- [ ] No hardcoded colors
- [ ] No hardcoded fonts except 'Inter'
- [ ] MessageCard used for post/article display
- [ ] Theme colors applied to all UI elements

---

**Document Version:** 1.1  
**Last Updated:** Feb 12, 2026  
**Last Updated By:** GitHub Copilot AI  
**Next Review:** After Phase 2 completion

---

## 📊 Completion Summary

### Phase 1: Design System ✅ 100% Complete
```
[████████████████████████████████] 100%

✅ Theme tokens (colors, typography, spacing)
✅ Header component
✅ MessageCard component  
✅ NavigationBar component
✅ SVG Icons (6 total)
✅ HomeScreen integration
✅ Comprehensive documentation
```

### Phase 2: Screen Updates ✅ Complete
```
[████████████████████████████████] 100%

✅ MainNavigator (consistent Header on all tabs)
✅ NewsScreen (MessageCard, theme, Composer)
✅ MessageBoardScreen (MessageCard announcement variant, embedded mode)
✅ NotificationsScreen (SVG icons, theme)
✅ SavedScreen (MessageCard, theme)
✅ SettingsScreen (SVG icons, dark mode toggle)
✅ NewsDetailScreen (theme typography)
✅ AnnouncementDetailScreen (theme typography)
✅ ProfileScreen (theme, SettingsIcon)
✅ LoginScreen (theme)
✅ SignUpScreen (theme)
✅ ForgotPasswordScreen (theme)
```

### Key Metrics
- **Components Created:** 4 (Header, MessageCard, NavigationBar, Icons)
- **SVG Icons:** 6 professional vector icons
- **Theme Variants:** 2 (Light & Dark modes)
- **Color Specifications:** 10+ Figma-accurate colors
- **Typography Styles:** 7 defined font styles
- **Documentation Pages:** 550+ lines of detailed guides

---
