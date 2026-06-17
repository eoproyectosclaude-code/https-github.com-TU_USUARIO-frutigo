import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatUsd } from '@frutigo/shared';
import { fontSize, typography } from '../theme/tokens';
import type { Theme } from '../theme/theme';

interface PriceProps {
  amountUsd: number;
  theme: Theme;
  locale?: 'es' | 'en';
  size?: 'sm' | 'md' | 'lg';
  prefix?: string;
}

export function Price({ amountUsd, theme, locale = 'es', size = 'md', prefix }: PriceProps) {
  const fs = size === 'lg' ? fontSize.xl : size === 'sm' ? fontSize.sm : fontSize.lg;
  return (
    <View style={styles.row}>
      {prefix ? (
        <Text style={[styles.prefix, { color: theme.colors.textMuted }]}>{prefix} </Text>
      ) : null}
      <Text style={[styles.amount, { color: theme.colors.primary, fontSize: fs }]}>
        {formatUsd(amountUsd, locale)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  prefix: { fontFamily: typography.body, fontSize: fontSize.xs },
  amount: { fontFamily: typography.title },
});
