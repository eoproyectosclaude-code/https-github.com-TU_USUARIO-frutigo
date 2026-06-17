import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, fontSize, typography } from '../theme/tokens';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
}

export function Badge({ label, color = '#22C55E', textColor = '#FFFFFF' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { fontFamily: typography.bodyMedium, fontSize: fontSize.xs },
});
