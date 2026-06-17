import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, borderRadius, typography } from '../../theme'

interface SoilMeterProps {
  moisture: number
  label?: string
}

export const SoilMeter: React.FC<SoilMeterProps> = ({ moisture, label }) => {
  const isGood = moisture > 70
  const isFair = moisture > 40
  const level = isGood ? 'Good' : isFair ? 'Fair' : 'Dry'
  const barColor = isGood ? colors.success : isFair ? colors.secondary : colors.error
  const icon = isGood ? '💧' : isFair ? '🌤' : '☀️'

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${moisture}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.level, { color: barColor }]}>{level}</Text>
        <Text style={styles.value}>{Math.round(moisture)}%</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  track: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  icon: {
    fontSize: 12,
  },
  level: {
    ...typography.small,
    fontWeight: '600',
  },
  value: {
    ...typography.small,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
})
