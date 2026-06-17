import React, { useRef, useEffect } from 'react'
import { View, Text, Animated, StyleSheet, Dimensions, StatusBar } from 'react-native'
import { colors, spacing, typography } from '../../theme'

interface SplashScreenProps {
  onComplete: () => void
}

const { width, height } = Dimensions.get('window')

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const logoAnim = useRef(new Animated.Value(0)).current
  const lineAnim = useRef(new Animated.Value(0)).current
  const tagAnim = useRef(new Animated.Value(0)).current
  const markAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(markAnim, {
        toValue: 1, duration: 700, useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 1, duration: 500, useNativeDriver: false,
        }),
      ]),
      Animated.timing(tagAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      Animated.delay(400),
    ]).start(() => onComplete())
  }, [])

  const markScale = markAnim.interpolate({
    inputRange: [0, 1], outputRange: [0.3, 1],
  })
  const markOpacity = markAnim.interpolate({
    inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 1],
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <View style={[styles.circle, styles.circleTopRight]} />
      <View style={[styles.circle, styles.circleBottomLeft]} />

      <Animated.View
        style={[
          styles.mark,
          { opacity: markOpacity, transform: [{ scale: markScale }] },
        ]}
      >
        <View style={styles.markRing}>
          <View style={styles.markInner} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.logoWrap, { opacity: logoAnim, transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Text style={styles.title}>EcoLink</Text>
        <Text style={styles.subtitle}>Africa</Text>
      </Animated.View>

      <Animated.View style={[styles.line, { width: lineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) }]} />

      <Animated.Text style={[styles.tagline, { opacity: tagAnim }]}>
        Voice. Trade. Grow.
      </Animated.Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>🇷🇼 🇰🇪 🇳🇬 🇿🇦 🇪🇹 🇬🇭 🇸🇳 🇨🇩</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circleTopRight: {
    width: width * 0.7,
    height: width * 0.7,
    top: -width * 0.25,
    right: -width * 0.2,
    backgroundColor: `${colors.primaryLight}20`,
  },
  circleBottomLeft: {
    width: width * 0.5,
    height: width * 0.5,
    bottom: -width * 0.15,
    left: -width * 0.15,
    backgroundColor: `${colors.secondaryLight}20`,
  },

  mark: {
    width: 80, height: 80,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  markRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: colors.secondaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  markInner: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.secondaryLight,
  },

  logoWrap: { alignItems: 'center' },
  title: {
    fontSize: 48, fontWeight: '800',
    color: colors.textOnDark, letterSpacing: -1,
  },
  subtitle: {
    fontSize: 48, fontWeight: '300',
    color: colors.secondaryLight,
    letterSpacing: 6, marginTop: -8,
  },

  line: {
    height: 2,
    backgroundColor: colors.secondary,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  tagline: {
    ...typography.body,
    color: colors.textOnDark,
    opacity: 0.7,
  },

  footer: {
    position: 'absolute',
    bottom: spacing.xxxl,
  },
  footerText: {
    fontSize: 16,
    letterSpacing: 4,
  },
})
