import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, StatusBar,
  TouchableOpacity, Animated, Image, ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { colors, spacing, borderRadius, typography, shadows } from '../../theme'
import { useAppSelector } from '../../hooks/useAppDispatch'
import { api } from '../../services/api'

interface ScanResult {
  cropType: string
  diseaseName: string
  diseaseNameLocal: string
  confidence: number
  treatmentPlan: string
  treatmentPlanLocal: string
  isHealthy: boolean
}

export const CropScannerScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const { user } = useAppSelector((s) => s.auth)
  const [scanned, setScanned] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [scanStep, setScanStep] = useState(0)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const scanLineAnim = useRef(new Animated.Value(-150)).current
  const cornerPulse = useRef(new Animated.Value(0)).current
  const radarPulse = useRef(new Animated.Value(0)).current
  const scanStepTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const SCAN_STEPS = ['📷 Loading image', '🔍 Analyzing leaf', '🧬 Identifying disease', '🌿 Generating treatment']

  useEffect(() => {
    return () => {
      if (scanStepTimer.current) clearInterval(scanStepTimer.current)
    }
  }, [])

  async function pickImage() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!granted) return
    const picker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    })
    if (!picker.canceled && picker.assets[0]) {
      await analyzeImage(picker.assets[0].uri)
    }
  }

  async function takePhoto() {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync()
    if (!granted) return
    const photo = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    })
    if (!photo.canceled && photo.assets[0]) {
      await analyzeImage(photo.assets[0].uri)
    }
  }

  async function analyzeImage(uri: string) {
    setImageUri(uri)
    setScanning(true)
    setScanned(false)
    setResult(null)
    setScanStep(0)

    // Corner pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(cornerPulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    )
    pulse.start()

    // Radar ring pulse
    const radar = Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(radarPulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    )
    radar.start()

    // Scan line
    const scanLine = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 350, duration: 1200, useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: -150, duration: 1200, useNativeDriver: true,
        }),
      ])
    )
    scanLine.start()

    // Progress steps timer
    scanStepTimer.current = setInterval(() => {
      setScanStep((p) => (p < SCAN_STEPS.length - 1 ? p + 1 : p))
    }, 1800)

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const lang = user?.language || 'rw'
      const res = await api.scanCrop(base64, lang)

      scanLine.stop()
      pulse.stop()
      radar.stop()
      if (scanStepTimer.current) clearInterval(scanStepTimer.current)

      const data: ScanResult = {
        cropType: res.cropType || 'Unknown',
        diseaseName: res.diseaseName || 'Unknown',
        diseaseNameLocal: res.diseaseNameLocal || '',
        confidence: res.confidence || 0,
        treatmentPlan: res.treatmentPlan || '',
        treatmentPlanLocal: res.treatmentPlanLocal || '',
        isHealthy: res.isHealthy ?? false,
      }
      setResult(data)
      setScanned(true)
      fadeAnim.setValue(0)
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }).start()
    } catch (e: any) {
      scanLine.stop()
      pulse.stop()
      radar.stop()
      if (scanStepTimer.current) clearInterval(scanStepTimer.current)

      const detail = e?.response?.data?.detail || e?.message || ''
      let msg = 'Unable to analyze image.'
      let hint = 'Please try again.'
      if (detail.includes('401') || detail.includes('token') || detail.includes('auth')) {
        msg = 'Session expired.'
        hint = 'Please log in again.'
      } else if (e?.response?.status === 413) {
        msg = 'Image too large.'
        hint = 'Try a smaller photo.'
      } else if (e?.response?.status && e?.response?.status >= 500) {
        msg = 'Server error.'
        hint = 'Please try again in a moment.'
      } else if (typeof detail === 'string' && detail.includes('connect')) {
        msg = 'Cannot reach server.'
        hint = 'Check your internet connection.'
      }
      setResult({
        cropType: 'Unknown',
        diseaseName: msg,
        diseaseNameLocal: hint,
        confidence: 0,
        treatmentPlan: '',
        treatmentPlanLocal: '',
        isHealthy: false,
      })
      setScanned(true)
    }
    setScanning(false)
  }

  const cornerOpacity = cornerPulse.interpolate({
    inputRange: [0, 1], outputRange: [0.4, 1],
  })
  const radarScale = radarPulse.interpolate({
    inputRange: [0, 1], outputRange: [0.8, 1.5],
  })
  const radarOpacity = radarPulse.interpolate({
    inputRange: [0, 1], outputRange: [0.5, 0],
  })

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {!scanned && !scanning && (
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📷</Text>
          <Text style={styles.heroTitle}>Scan your crops for diseases</Text>
          <Text style={styles.heroSub}>Take a photo of the affected leaf</Text>
          <View style={styles.viewfinder}>
            <View style={styles.viewfinderCornerTL} />
            <View style={styles.viewfinderCornerTR} />
            <View style={styles.viewfinderCornerBL} />
            <View style={styles.viewfinderCornerBR} />
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={takePhoto} activeOpacity={0.8}>
            <Text style={styles.scanBtnText}>📸 Scan Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.galleryLink}
            activeOpacity={0.8}
          >
            <Text style={styles.galleryLinkText}>Choose from gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {scanning && (
        <View style={styles.scanningContainer}>
          {imageUri && (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <View style={styles.scanOverlay}>
                {/* Radar pulse ring */}
                <Animated.View style={[styles.radarRing, { opacity: radarOpacity, transform: [{ scale: radarScale }] }]} />
                {/* Corner brackets */}
                <Animated.View style={[styles.cornerBracketTL, { opacity: cornerOpacity }]} />
                <Animated.View style={[styles.cornerBracketTR, { opacity: cornerOpacity }]} />
                <Animated.View style={[styles.cornerBracketBL, { opacity: cornerOpacity }]} />
                <Animated.View style={[styles.cornerBracketBR, { opacity: cornerOpacity }]} />
                {/* Scan line */}
                <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineAnim }] }]} />
                {/* Crosshair center */}
                <View style={styles.crosshairH} />
                <View style={styles.crosshairV} />
              </View>
            </View>
          )}
          <View style={styles.scanStepsRow}>
            {SCAN_STEPS.map((step, i) => (
              <View key={i} style={styles.scanStepItem}>
                <View style={[styles.scanStepDot, i < scanStep && styles.scanStepDone, i === scanStep && styles.scanStepActive]} />
                <Text style={[styles.scanStepText, i > scanStep && styles.scanStepTextFaded]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {scanned && result && (
        <ScrollView
          contentContainerStyle={styles.resultScroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.resultImage} />
            )}

            <View style={[styles.statusBadge, { backgroundColor: result.isHealthy ? `${colors.success}20` : `${colors.error}20` }]}>
              <Text style={styles.statusIcon}>{result.isHealthy ? '✅' : '⚠️'}</Text>
              <Text style={[styles.statusText, { color: result.isHealthy ? colors.success : colors.error }]}>
                {result.isHealthy ? 'Crop is Healthy!' : 'Disease Detected'}
              </Text>
            </View>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Crop Type</Text>
                <Text style={styles.resultValue}>{result.cropType}</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Disease</Text>
                <Text style={styles.resultValue}>{result.diseaseNameLocal || result.diseaseName}</Text>
              </View>
              {result.diseaseNameLocal && result.diseaseNameLocal !== result.diseaseName && (
                <Text style={styles.resultValueEn}>{result.diseaseName}</Text>
              )}
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Confidence</Text>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${Math.round(result.confidence * 100)}%` }]} />
                </View>
                <Text style={styles.confidenceText}>{Math.round(result.confidence * 100)}%</Text>
              </View>
            </View>

            {result.treatmentPlan ? (
              <View style={styles.treatmentCard}>
                <Text style={styles.treatmentTitle}>🌿 Treatment Plan</Text>
                <Text style={styles.treatmentText}>{result.treatmentPlanLocal || result.treatmentPlan}</Text>
                {result.treatmentPlanLocal && result.treatmentPlanLocal !== result.treatmentPlan && (
                  <>
                    <View style={styles.treatmentDivider} />
                    <Text style={styles.treatmentTextEn}>{result.treatmentPlan}</Text>
                  </>
                )}
              </View>
            ) : result.diseaseName === 'Analysis unavailable' || result.diseaseName === 'Unable to analyze image.' || result.diseaseName === 'Session expired.' || result.diseaseName === 'Image too large.' || result.diseaseName === 'Server error.' || result.diseaseName === 'Cannot reach server.' ? null : (
              <View style={styles.treatmentCard}>
                <Text style={styles.treatmentTitle}>🌿 Treatment Plan</Text>
                <Text style={styles.treatmentText}>No treatment information available for this crop.</Text>
              </View>
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.scanAgainBtn}
            onPress={() => {
              setScanned(false)
              setResult(null)
              setImageUri(null)
              setScanning(false)
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.scanAgainText}>📸 Scan Another</Text>
          </TouchableOpacity>

          <View style={{ height: spacing.huge }} />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },

  hero: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  heroEmoji: { fontSize: 64, marginBottom: spacing.lg },
  heroTitle: {
    ...typography.h2,
    color: colors.textOnDark, textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSub: {
    ...typography.body,
    color: colors.textOnDark, opacity: 0.7,
    textAlign: 'center', marginBottom: spacing.xxl,
  },

  viewfinder: {
    width: 240, height: 320,
    borderWidth: 2,
    borderColor: colors.secondaryLight,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xxl,
    position: 'relative',
  },
  viewfinderCornerTL: {
    position: 'absolute', top: -2, left: -2,
    width: 24, height: 24,
    borderTopWidth: 4, borderLeftWidth: 4,
    borderColor: colors.secondaryLight,
  },
  viewfinderCornerTR: {
    position: 'absolute', top: -2, right: -2,
    width: 24, height: 24,
    borderTopWidth: 4, borderRightWidth: 4,
    borderColor: colors.secondaryLight,
  },
  viewfinderCornerBL: {
    position: 'absolute', bottom: -2, left: -2,
    width: 24, height: 24,
    borderBottomWidth: 4, borderLeftWidth: 4,
    borderColor: colors.secondaryLight,
  },
  viewfinderCornerBR: {
    position: 'absolute', bottom: -2, right: -2,
    width: 24, height: 24,
    borderBottomWidth: 4, borderRightWidth: 4,
    borderColor: colors.secondaryLight,
  },

  scanBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.round,
    ...shadows.md,
  },
  scanBtnText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  galleryLink: {
    marginTop: spacing.lg,
  },
  galleryLinkText: {
    ...typography.body,
    color: colors.textOnDark, opacity: 0.7,
    textDecorationLine: 'underline',
  },

  scanningContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  previewWrap: {
    width: 260, height: 340,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.xl,
  },
  previewImage: {
    width: '100%', height: '100%',
    position: 'absolute',
    opacity: 0.6,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.secondaryLight,
    overflow: 'hidden',
  },
  radarRing: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: 120, height: 120,
    marginLeft: -60, marginTop: -60,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.secondaryLight,
  },
  cornerBracketTL: {
    position: 'absolute', top: -2, left: -2,
    width: 30, height: 30,
    borderTopWidth: 4, borderLeftWidth: 4,
    borderColor: colors.secondary,
  },
  cornerBracketTR: {
    position: 'absolute', top: -2, right: -2,
    width: 30, height: 30,
    borderTopWidth: 4, borderRightWidth: 4,
    borderColor: colors.secondary,
  },
  cornerBracketBL: {
    position: 'absolute', bottom: -2, left: -2,
    width: 30, height: 30,
    borderBottomWidth: 4, borderLeftWidth: 4,
    borderColor: colors.secondary,
  },
  cornerBracketBR: {
    position: 'absolute', bottom: -2, right: -2,
    width: 30, height: 30,
    borderBottomWidth: 4, borderRightWidth: 4,
    borderColor: colors.secondary,
  },
  crosshairH: {
    position: 'absolute',
    top: '50%', left: '40%', right: '40%',
    height: 1,
    backgroundColor: `${colors.secondary}60`,
  },
  crosshairV: {
    position: 'absolute',
    left: '50%', top: '40%', bottom: '40%',
    width: 1,
    backgroundColor: `${colors.secondary}60`,
  },
  scanLine: {
    width: '100%', height: 2,
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  scanStepsRow: {
    gap: spacing.sm,
    width: '100%',
    maxWidth: 300,
  },
  scanStepItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm,
  },
  scanStepDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.borderLight,
    borderWidth: 2, borderColor: colors.secondaryLight,
  },
  scanStepDone: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  scanStepActive: {
    backgroundColor: 'transparent',
    borderColor: colors.secondary,
  },
  scanStepText: {
    ...typography.small,
    color: colors.textOnDark,
    fontWeight: '500',
  },
  scanStepTextFaded: {
    opacity: 0.4,
  },

  resultScroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  resultImage: {
    width: '100%', height: 200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    marginBottom: spacing.lg,
  },
  statusIcon: { fontSize: 20 },
  statusText: {
    ...typography.bodyBold,
  },

  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  resultValue: {
    ...typography.bodyBold,
    color: colors.text, flex: 1, textAlign: 'right',
  },
  resultValueEn: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'right', marginTop: 2,
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  confidenceBar: {
    flex: 1, height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.round,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
  },
  confidenceText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '700', width: 40, textAlign: 'right',
  },

  treatmentCard: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  treatmentTitle: {
    ...typography.h4,
    color: colors.text, marginBottom: spacing.sm,
  },
  treatmentText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  treatmentDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  treatmentTextEn: {
    ...typography.small,
    color: colors.textMuted,
    lineHeight: 20,
  },

  scanAgainBtn: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: colors.secondaryLight,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  scanAgainText: {
    ...typography.button,
    color: colors.secondaryLight,
  },
})
