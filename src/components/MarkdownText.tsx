import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { font, spacing } from '../theme';

interface Props {
  children: string;
  color: string;
  bgColor: string;
  isRTL?: boolean;
}

type Segment =
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'plain'; text: string };

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  // Pattern: **bold**, *italic*, `code`
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'plain', text: text.slice(last, match.index) });
    }
    if (match[2] !== undefined) {
      segments.push({ type: 'bold', text: match[2] });
    } else if (match[3] !== undefined) {
      segments.push({ type: 'italic', text: match[3] });
    } else if (match[4] !== undefined) {
      segments.push({ type: 'code', text: match[4] });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ type: 'plain', text: text.slice(last) });
  }
  return segments;
}

function InlineText({ segments, color, bgColor, size = font.sizes.base }: {
  segments: Segment[];
  color: string;
  bgColor: string;
  size?: number;
}) {
  return (
    <Text>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'bold':
            return <Text key={i} style={{ fontWeight: font.weights.bold as any, color, fontSize: size }}>{seg.text}</Text>;
          case 'italic':
            return <Text key={i} style={{ fontStyle: 'italic', color, fontSize: size }}>{seg.text}</Text>;
          case 'code':
            return <Text key={i} style={[s.inlineCode, { color, backgroundColor: bgColor, fontSize: size - 1 }]}>{seg.text}</Text>;
          default:
            return <Text key={i} style={{ color, fontSize: size }}>{seg.text}</Text>;
        }
      })}
    </Text>
  );
}

export function MarkdownText({ children, color, bgColor, isRTL }: Props) {
  const lines = children.split('\n');
  const align = isRTL ? 'right' : 'left';
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === '') {
      elements.push(<View key={`gap-${i}`} style={{ height: spacing.xs }} />);
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      elements.push(
        <Text key={i} style={[s.h1, { color, textAlign: align }]}>
          {h1[1]}
        </Text>,
      );
      i++; continue;
    }
    if (h2) {
      elements.push(
        <Text key={i} style={[s.h2, { color, textAlign: align }]}>
          {h2[1]}
        </Text>,
      );
      i++; continue;
    }
    if (h3) {
      elements.push(
        <Text key={i} style={[s.h3, { color, textAlign: align }]}>
          {h3[1]}
        </Text>,
      );
      i++; continue;
    }

    // Code block (```)
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <View key={`code-${i}`} style={[s.codeBlock, { backgroundColor: bgColor }]}>
          <Text style={[s.codeText, { color }]}>{codeLines.join('\n')}</Text>
        </View>,
      );
      continue;
    }

    // Bullet list
    const bullet = line.match(/^(\s*[-*+])\s(.+)/);
    if (bullet) {
      const bulletLines: string[] = [];
      while (i < lines.length && lines[i].match(/^(\s*[-*+])\s(.+)/)) {
        bulletLines.push(lines[i].replace(/^(\s*[-*+])\s/, ''));
        i++;
      }
      elements.push(
        <View key={`ul-${i}`} style={s.list}>
          {bulletLines.map((bl, bi) => (
            <View key={bi} style={[s.listItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[s.bullet, { color }]}>{'•'}</Text>
              <InlineText segments={parseInline(bl)} color={color} bgColor={bgColor} />
            </View>
          ))}
        </View>,
      );
      continue;
    }

    // Numbered list
    const numbered = line.match(/^\d+\.\s(.+)/);
    if (numbered) {
      const numLines: string[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\.\s(.+)/)) {
        numLines.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <View key={`ol-${i}`} style={s.list}>
          {numLines.map((nl, ni) => (
            <View key={ni} style={[s.listItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[s.bullet, { color }]}>{`${ni + 1}.`}</Text>
              <InlineText segments={parseInline(nl)} color={color} bgColor={bgColor} />
            </View>
          ))}
        </View>,
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      elements.push(<View key={i} style={[s.hr, { backgroundColor: color + '40' }]} />);
      i++; continue;
    }

    // Normal paragraph
    elements.push(
      <Text key={i} style={[s.paragraph, { textAlign: align }]}>
        <InlineText segments={parseInline(line)} color={color} bgColor={bgColor} />
      </Text>,
    );
    i++;
  }

  return <View>{elements}</View>;
}

const s = StyleSheet.create({
  bullet: { fontSize: font.sizes.base, marginHorizontal: 6, lineHeight: 22 },
  codeBlock: { borderRadius: 8, marginVertical: spacing.xs, padding: spacing.sm },
  codeText: { fontFamily: 'monospace', fontSize: font.sizes.sm, lineHeight: 20 },
  h1: { fontSize: font.sizes.xl, fontWeight: font.weights.bold as any, lineHeight: 28, marginBottom: spacing.xs },
  h2: { fontSize: font.sizes.lg, fontWeight: font.weights.bold as any, lineHeight: 26, marginBottom: spacing.xs },
  h3: { fontSize: font.sizes.base, fontWeight: font.weights.semibold as any, lineHeight: 24, marginBottom: 2 },
  hr: { height: 1, marginVertical: spacing.sm },
  inlineCode: { borderRadius: 4, paddingHorizontal: 4 },
  list: { gap: 4, marginVertical: spacing.xs },
  listItem: { alignItems: 'flex-start', gap: 4 },
  paragraph: { fontSize: font.sizes.base, lineHeight: 22, marginBottom: 2 },
});
