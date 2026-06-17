import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, typography, shadows } from '../../theme'
import { LanguagePicker } from '../../components/shared/LanguagePicker'
import { api } from '../../services/api'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { register } from '../../store/slices/authSlice'

interface Language { code: string; name: string }

const STEPS = ['language', 'profile', 'farm', 'complete']
const { height: SCREEN_H } = Dimensions.get('window')
const IS_SHORT = SCREEN_H < 700

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLang, setSelectedLang] = useState('rw')
  const [fullName, setFullName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    api.getLanguages().then(setLanguages).catch(() => {})
  }, [])

  function goToStep(next: number) {
    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 250, useNativeDriver: true,
    }).start()
    setStep(next)
    setError('')
  }

  async function handleContinue() {
    if (step === 0 && !selectedLang) return
    if (step === 1 && !fullName.trim()) return
    if (step < STEPS.length - 1) { goToStep(step + 1); return }

    setLoading(true); setError('')
    try {
      await dispatch(register({
        username: `user_${Date.now()}`,
        email: `${fullName.toLowerCase().replace(/\s/g, '')}_${Date.now()}@ecolink.app`,
        password: 'welcome123',
        role: 'farmer',
        language: selectedLang,
        full_name: fullName.trim(),
        farm_name: farmName.trim() || undefined,
        phone: phone.trim() || undefined,
      })).unwrap()
    } catch (e: any) {
      setError(typeof e === 'string' ? e : e?.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[
            styles.progressDot,
            i < step && styles.progressDotDone,
            i === step && styles.progressDotActive,
          ]} />
        ))}
      </View>

      <Animated.View style={[styles.stepWrap, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <View style={styles.stepInner}>
              <Text style={styles.emoji}>🌍🗣️</Text>
              <Text style={styles.heading}>What language do you speak?</Text>
              <LanguagePicker selected={selectedLang} languages={languages} onSelect={setSelectedLang} label="Your language" />
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepInner}>
              <Text style={styles.emoji}>👋</Text>
              <Text style={styles.heading}>What's your name?</Text>
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={colors.textMuted} value={fullName} onChangeText={setFullName} autoFocus />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepInner}>
              <Text style={styles.emoji}>🌱</Text>
              <Text style={styles.heading}>Tell us about your farm</Text>
              <TextInput style={styles.input} placeholder="Farm name (optional)" placeholderTextColor={colors.textMuted} value={farmName} onChangeText={setFarmName} />
              <TextInput style={[styles.input, { marginTop: spacing.md }]} placeholder="Phone number (optional)" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TouchableOpacity onPress={() => goToStep(3)} activeOpacity={0.8}>
                <Text style={styles.skipLink}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepInner}>
              <Text style={styles.emoji}>🚀</Text>
              <Text style={styles.heading}>You're all set!</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Language</Text>
                <Text style={styles.summaryValue}>{languages.find((l) => l.code === selectedLang)?.name || selectedLang}</Text>
                <View style={styles.summaryDivider} />
                <Text style={styles.summaryLabel}>Name</Text>
                <Text style={styles.summaryValue}>{fullName}</Text>
                {farmName ? (<><View style={styles.summaryDivider} /><Text style={styles.summaryLabel}>Farm</Text><Text style={styles.summaryValue}>{farmName}</Text></>) : null}
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.footerRow}>
          {step > 0 && (
            <TouchableOpacity onPress={() => goToStep(step - 1)} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.continueBtn, (step === 1 && !fullName.trim()) && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={loading || (step === 1 && !fullName.trim())}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color={colors.textOnPrimary} /> : (
              <Text style={styles.continueText}>{step < STEPS.length - 1 ? 'Continue' : '🌍 Enter Village Square'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: IS_SHORT ? spacing.md : spacing.xl,
  },
  progressDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotDone: {
    backgroundColor: colors.primary,
  },
  progressDotActive: {
    width: 24, height: 8, borderRadius: 4,
    backgroundColor: colors.primary,
  },

  stepWrap: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  stepInner: {
    alignItems: 'center',
  },

  emoji: {
    fontSize: IS_SHORT ? 48 : 64,
    marginBottom: IS_SHORT ? spacing.md : spacing.lg,
  },
  heading: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: IS_SHORT ? spacing.lg : spacing.xxl,
  },

  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
  },

  skipLink: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    textDecorationLine: 'underline',
  },

  summaryCard: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },

  errorText: {
    ...typography.small,
    color: colors.error,
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backText: {
    ...typography.body,
    color: colors.textMuted,
  },
  continueBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
})
