export type ThemeType = typeof lightTheme;

export const lightTheme = {
    dark: false,
    colors: {
        background: '#F2F1F6', // Light gray background (from Figma)
        header: '#F2F1F6', // Matching header background (from Figma)
        surface: '#FFFFFF', // White surface
        primary: '#ED1D26', // CBN Red
        secondary: '#8E8E93', // Gray secondary (from Figma)
        text: '#000000', // Black text (from Figma)
        textSecondary: '#8E8E93', // Gray text (from Figma)
        border: '#E5E7EB',
        inputBackground: '#FFFFFF',
        messageSent: '#E7FFDB',
        messageReceived: '#FFFFFF',
        fab: '#ED1D26', // Red FAB
        icon: '#54656F',
        unreadBadge: '#ED1D26',
        blueTick: '#ED1D26',
        danger: '#DC2626',
        cardBackground: '#FFFFFF', // White card for light mode
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 12,
        l: 16,
        xl: 24,
    },
    typography: {
        adminTitle: { fontSize: 12, fontWeight: '600' as '600', fontFamily: 'Inter' },
        postTextRegular: { fontSize: 16, fontWeight: '500' as '500', fontFamily: 'Inter', lineHeight: 24 },
        postTextBold: { fontSize: 16, fontWeight: '700' as '700', fontFamily: 'Inter', lineHeight: 24 },
        postLink: { fontSize: 16, fontWeight: '400' as '400', fontFamily: 'Inter', lineHeight: 23 },
        header: { fontSize: 22, fontWeight: 'bold' as 'bold' },
        subHeader: { fontSize: 16, fontWeight: '600' as '600' },
        body: { fontSize: 16 },
        caption: { fontSize: 14, color: '#8E8E93' },
    }
};

export const darkTheme = {
    dark: true,
    colors: {
        background: '#000000', // Pure black background
        header: '#000000', // Pure black header
        surface: '#1C1C1E', // Dark surface/cards (from Figma)
        primary: '#ED1D26', // CBN Red
        secondary: '#8696A0',
        text: '#FFFFFF', // White text (from Figma)
        textSecondary: '#BDBDBD', // Light gray text (from Figma)
        border: '#2A3942',
        inputBackground: '#2A3942',
        messageSent: '#005C4B',
        messageReceived: '#1C1C1E', // Dark gray for received (Figma card color)
        fab: '#ED1D26', // Red FAB matching primary
        icon: '#8696A0', // Gray icons
        unreadBadge: '#ED1D26',
        blueTick: '#ED1D26',
        danger: '#EF4444',
        cardBackground: '#1C1C1E', // Dark card background (from Figma)
    },
    spacing: lightTheme.spacing,
    typography: {
        adminTitle: { fontSize: 12, fontWeight: '600' as '600', fontFamily: 'Inter' },
        postTextRegular: { fontSize: 16, fontWeight: '500' as '500', fontFamily: 'Inter', lineHeight: 24 },
        postTextBold: { fontSize: 16, fontWeight: '700' as '700', fontFamily: 'Inter', lineHeight: 24 },
        postLink: { fontSize: 16, fontWeight: '400' as '400', fontFamily: 'Inter', lineHeight: 23 },
        header: { fontSize: 22, fontWeight: 'bold' as 'bold' },
        subHeader: { fontSize: 16, fontWeight: '600' as '600' },
        body: { fontSize: 16 },
        caption: { fontSize: 14, color: '#8696A0' },
    }
};

export const theme = lightTheme; // Default export for now to prevent breaking

