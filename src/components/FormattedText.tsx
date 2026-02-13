import React from 'react';
import { Text, StyleSheet, Platform, TextStyle, StyleProp, View } from 'react-native';

type SegmentStyle = 'bold' | 'italic' | 'strike' | 'underline' | 'mono';

type Segment = {
    text: string;
    style?: SegmentStyle;
    isUrl?: boolean;
};

const MARKERS: { marker: string; style: SegmentStyle }[] = [
    { marker: '**', style: 'bold' },
    { marker: '*', style: 'bold' },
    { marker: '__', style: 'underline' },
    { marker: '_', style: 'italic' },
    { marker: '~', style: 'strike' },
    { marker: '`', style: 'mono' },
];

import { LinkPreview } from './LinkPreview';

const parseFormattedText = (input: string): Segment[] => {
    // First pass: Handle formatting markers
    let segments: Segment[] = [];
    let i = 0;

    while (i < input.length) {
        let nextIndex = -1;
        let nextMarker: string | null = null;
        let nextStyle: SegmentStyle | null = null;

        for (const { marker, style } of MARKERS) {
            const idx = input.indexOf(marker, i);
            if (idx === -1) continue;
            if (nextIndex === -1 || idx < nextIndex || (idx === nextIndex && marker.length > (nextMarker?.length || 0))) {
                nextIndex = idx;
                nextMarker = marker;
                nextStyle = style;
            }
        }

        if (nextIndex === -1 || !nextMarker || !nextStyle) {
            segments.push({ text: input.slice(i) });
            break;
        }

        if (nextIndex > i) {
            segments.push({ text: input.slice(i, nextIndex) });
        }

        const contentStart = nextIndex + nextMarker.length;
        const contentEnd = input.indexOf(nextMarker, contentStart);

        if (contentEnd === -1) {
            segments.push({ text: nextMarker });
            i = contentStart;
            continue;
        }

        const content = input.slice(contentStart, contentEnd);
        segments.push({ text: content, style: nextStyle });
        i = contentEnd + nextMarker.length;
    }

    // Second pass: Handle URLs in text segments
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const finalSegments: Segment[] = [];

    segments.forEach(segment => {
        if (segment.style || !segment.text) {
            finalSegments.push(segment);
            return;
        }

        const parts = segment.text.split(urlRegex);
        parts.forEach(part => {
            if (part.match(urlRegex)) {
                finalSegments.push({ text: part, isUrl: true });
            } else if (part) {
                finalSegments.push({ text: part });
            }
        });
    });

    return finalSegments;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    bold: { fontWeight: '700' },
    italic: { fontStyle: 'italic' },
    strike: { textDecorationLine: 'line-through' },
    underline: { textDecorationLine: 'underline' },
    mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
});

export const FormattedText = ({ text, style }: { text: string; style?: StyleProp<TextStyle> }) => {
    const segments = parseFormattedText(text || '');

    // flattenedStyle to extract text-specific props if needed, 
    // but for now we'll pass full style to Text children and assume View ignores them or handles layout.
    // However, to avoid double padding if 'style' has padding, we should ideally separate them.
    // For this implementation, we apply 'style' to the container View to handle margins/padding/alignment
    // and also to Text to handle color/font. 
    // NOTE: This might cause double padding if padding is in 'style'. 
    // Ideally the parent should split styles.

    return (
        <View style={[styles.container, style]}>
            {segments.map((segment, idx) => {
                if (segment.isUrl) {
                    return <LinkPreview key={idx} url={segment.text} />;
                }

                // We pass 'style' to Text to inherit font/color. 
                // We explicitly reset padding/margin on Text to avoid doubling up from the parent style
                const textStyles = [
                    style,
                    segment.style && styles[segment.style],
                    { margin: 0, padding: 0, marginTop: 0, marginBottom: 0, marginHorizontal: 0, paddingHorizontal: 0 }
                ];

                return (
                    <Text key={idx} style={textStyles}>
                        {segment.text}
                    </Text>
                );
            })}
        </View>
    );
};
