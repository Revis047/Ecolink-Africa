import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { colors, spacing, borderRadius, typography, shadows } from '../../theme'

interface CropCardProps {
  name: string
  nameLocal?: string
  price: number
  trend?: 'up' | 'down' | 'stable'
  quantity?: string
  location?: string
  grade?: string
  onPress?: () => void
}

const CROP_EMOJI: Record<string, string> = {
  avocado: '🥑', maize: '🌽', cassava: '🌱', coffee: '☕',
  tea: '🍵', mango: '🥭', cashew: '🥜', sesame: '🌾',
  tomato: '🍅', banana: '🍌', rice: '🍚', yam: '🍠',
  cocoa: '🍫', cotton: '🌿', sorghum: '🌾', millet: '🌿',
  pineapple: '🍍', orange: '🍊', papaya: '🍈',
}

function getCropEmoji(name: string): string {
  const key = name.toLowerCase()
  return CROP_EMOJI[key] || '🌿'
}

function trendColor(trend?: string): string {
  if (trend === 'up') return colors.success
  if (trend === 'down') return colors.error
  return colors.textMuted
}

function trendIcon(trend?: string): string {
  if (trend === 'up') return '▲'
  if (trend === 'down') return '▼'
  return '―'
}

export const CropCard: React.FC<CropCardProps> = ({
  name, nameLocal, price, trend, quantity, location, grade, onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {grade && (
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{grade}</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.emoji}>{getCropEmoji(name)}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{nameLocal || name}</Text>
          {nameLocal && <Text style={styles.nameEn}>{name}</Text>}
          {location && (
            <Text style={styles.location}>📍 {location}</Text>
          )}
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.price}>${price.toFixed(2)}</Text>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: `${trendColor(trend)}20` }]}>
              <Text style={[styles.trendText, { color: trendColor(trend) }]}>
                {trendIcon(trend)}
              </Text>
            </View>
          )}
        </View>
      </View>
      {quantity && (
        <Text style={styles.quantity}>{quantity}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  gradeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  gradeText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodyBold,
    color: colors.text,
  },
  nameEn: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 1,
  },
  location: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    ...typography.price,
    color: colors.text,
  },
  trendBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  trendText: {
    ...typography.caption,
    fontWeight: '700',
  },
  quantity: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
})
