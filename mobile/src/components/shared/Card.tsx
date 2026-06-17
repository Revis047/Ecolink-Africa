import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors, spacing, borderRadius, shadows } from '../../theme'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'compact' | 'feature' | 'stat'
  accentColor?: string
  style?: ViewStyle
}

export const Card: React.FC<CardProps> = ({
  children, variant = 'default', accentColor, style,
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'compact' && styles.compact,
        variant === 'stat' && styles.stat,
        variant === 'feature' && styles.feature,
        accentColor && { borderLeftColor: accentColor },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  compact: {
    padding: spacing.md,
  },
  stat: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  feature: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
})
