import React from 'react';
import { Text, StyleSheet, Platform, TextStyle } from 'react-native';

type SegmentStyle = 'bold' | 'italic' | 'strike' | 'underline' | 'mono';

type Segment = {
    text: string;
    style?: SegmentStyle;
};

const MARKERS: { marker: string; style: SegmentStyle }[] = [
    { marker: '**', style: 'bold' },
    { marker: '*', style: 'bold' },
    { marker: '__', style: 'underline' },
    { marker: '_', style: 'italic' },
    { marker: '~', style: 'strike' },
    { marker: '`', style: 'mono' },
];

const parseFormattedText = (input: string): Segment[] => {
    const segments: Segment[] = [];
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

    return segments;
};

const styles = StyleSheet.create({
    bold: { fontWeight: '700' },
    italic: { fontStyle: 'italic' },
    strike: { textDecorationLine: 'line-through' },
    underline: { textDecorationLine: 'underline' },
    mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
});

export const FormattedText = ({ text, style }: { text: string; style?: TextStyle }) => {
    const segments = parseFormattedText(text || '');
    return (
        <Text style={style}>
            {segments.map((segment, idx) => {
                if (!segment.style) {
                    return <Text key={idx}>{segment.text}</Text>;
                }
                return (
                    <Text key={idx} style={styles[segment.style]}>
                        {segment.text}
                    </Text>
                );
            })}
        </Text>
    );
};
