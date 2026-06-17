import React, { useRef, useEffect } from 'react'
import {
  TouchableOpacity, Animated, StyleSheet, View, Text,
} from 'react-native'
import { colors, spacing, shadows, typography } from '../../theme'

interface VoiceButtonProps {
  onPress: () => void
  isListening?: boolean
  size?: number
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onPress, isListening = false, size = 96,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const ringAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15, duration: 700, useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1, duration: 700, useNativeDriver: true,
          }),
        ])
      ).start()

      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1, duration: 1800, useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0, duration: 0, useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
      ringAnim.setValue(0)
    }
  }, [isListening])

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  })
  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  })

  return (
    <View style={styles.wrapper}>
      {isListening && (
        <Animated.View
          style={[
            styles.ring,
            {
              width: size * 1.2, height: size * 1.2, borderRadius: size * 0.6,
              transform: [{ scale: ringScale }], opacity: ringOpacity,
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.button,
          {
            width: size, height: size, borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
            backgroundColor: isListening ? colors.secondary : colors.primary,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={styles.touchable}
        >
          <Text style={[styles.icon, { fontSize: size * 0.4 }]}>
            {isListening ? '🔊' : '🎤'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.label}>
        {isListening ? 'Tap to stop' : 'Tap to speak'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', borderWidth: 2,
    borderColor: colors.secondary,
  },
  button: {
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2, ...shadows.md,
  },
  touchable: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%',
  },
  icon: { color: '#fff' },
  label: {
    marginTop: spacing.lg, ...typography.small,
    fontWeight: '600',
    color: colors.textSecondary, letterSpacing: 0.3,
  },
})
