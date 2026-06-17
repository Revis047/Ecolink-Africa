import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, StatusBar, RefreshControl, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, typography, shadows } from '../../theme'
import { CropCard } from '../../components/shared/CropCard'
import { SoilMeter } from '../../components/shared/SoilMeter'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { fetchListings, checkPrice } from '../../store/slices/marketSlice'

const GREETINGS: Record<string, string> = {
  rw: 'Mwaramutse', rn: 'Amahoro', ln: 'Mbote', sw: 'Habari',
  lg: 'Oli otya', ha: 'Sannu', yo: 'Bawo', ig: 'Ndeewo',
  am: 'Selam', om: 'Akkam', so: 'Maalin wanaagsan', zu: 'Sawubona',
  xh: 'Molo', af: 'Hallo', st: 'Lumela', tn: 'Dumela',
  sn: 'Mhoro', nd: 'Salibonani', ss: 'Sawubona', ve: 'Ndaa',
  ts: 'Minjhani', nso: 'Thobela', nr: 'Salibonani', ki: 'Wĩmwega',
  luo: 'Misawa', bem: 'Mwabuka', ny: 'Moni', mg: 'Salama',
  sg: 'Bara', bm: 'Anw ka kɛnɛ', wo: 'Salaam', ff: 'Mi yettii',
  kri: 'Kushe', dyu: 'Anw ka kɛnɛ', mos: 'Yɛɛlɛ', ee: 'Nenyo',
  tw: 'Akwaaba', gaa: 'Teŋ', dag: 'Anigoo', ber: 'Azul',
  ar: 'Salam', fr: 'Bonjour', pt: 'Olá', es: 'Hola',
  zh: '你好', en: 'Hello',
}

const QUICK_ACTIONS = [
  { icon: '📷', label: 'Scan Crop', tab: 'CropScanner' },
  { icon: '📊', label: 'Market', tab: 'Market' },
  { icon: '💬', label: 'Messages', tab: 'Chat' },
  { icon: '🌤', label: 'Weather', tab: '' },
]

const SCREEN_W = Dimensions.get('window').width

export const VillageSquareScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { listings, priceCache } = useAppSelector((s) => s.market)

  const [refreshing, setRefreshing] = useState(false)
  const scrollY = useRef(new Animated.Value(0)).current

  const greeting = GREETINGS[user?.language || 'en'] || 'Hello'

  useEffect(() => {
    dispatch(fetchListings())
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await dispatch(fetchListings())
    setRefreshing(false)
  }, [])

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [160, 80],
    extrapolate: 'clamp',
  })

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  })

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{user?.fullName || user?.username || 'Farmer'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👨‍🌾</Text>
          </View>
        </View>
        <Animated.View style={[styles.statsRow, { opacity: headerOpacity }]}>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>🌤 27°C</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>📡 Strong</Text>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <TouchableOpacity
          style={styles.voicePrompt}
          activeOpacity={0.8}
        >
          <View style={styles.voiceIconWrap}>
            <Text style={styles.voiceIcon}>🎤</Text>
          </View>
          <View style={styles.voicePromptText}>
            <Text style={styles.voicePromptTitle}>Ask EcoLink anything about farming</Text>
            <Text style={styles.voicePromptSub}>Tap to speak</Text>
          </View>
          <Text style={styles.chevronRight}>→</Text>
        </TouchableOpacity>

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickCard} activeOpacity={0.8}>
              <View style={styles.quickIconWrap}>
                <Text style={styles.quickIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market Prices</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.sectionLink}>See all →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.priceRow}
        >
          {['avocado', 'maize', 'coffee', 'cassava', 'mango'].map((crop) => {
            const data = priceCache[crop]
            return (
              <TouchableOpacity
                key={crop}
                style={styles.pricePill}
                onPress={() => dispatch(checkPrice({ cropName: crop }))}
                activeOpacity={0.8}
              >
                <Text style={styles.pricePillEmoji}>
                  {crop === 'avocado' ? '🥑' : crop === 'maize' ? '🌽' : crop === 'coffee' ? '☕' : crop === 'cassava' ? '🌱' : '🥭'}
                </Text>
                <Text style={styles.pricePillName}>{crop}</Text>
                <Text style={styles.pricePillValue}>
                  ${data ? data.priceUsd.toFixed(2) : '—'}
                </Text>
                {data && (
                  <View style={[styles.trendBadge, { backgroundColor: data.trend === 'up' ? `${colors.success}20` : `${colors.error}20` }]}>
                    <Text style={[styles.trendText, { color: data.trend === 'up' ? colors.success : colors.error }]}>
                      {data.trend === 'up' ? '▲' : '▼'} {Math.abs(data.percentageChange).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <View style={styles.farmHealthRow}>
          <View style={styles.farmHealthCard}>
            <SoilMeter moisture={72} label="Soil Moisture" />
          </View>
          <View style={styles.farmHealthCard}>
            <SoilMeter moisture={45} label="Crop Health" />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fresh Listings</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.sectionLink}>See all →</Text>
          </TouchableOpacity>
        </View>
        {listings.slice(0, 3).map((listing) => (
          <CropCard
            key={listing.id}
            name={listing.cropName}
            nameLocal={listing.cropNameZh}
            price={listing.priceUsd || listing.price}
            trend={listing.status === 'active' ? 'up' : 'stable'}
            quantity={`${listing.quantity} ${listing.unit}`}
            location={listing.location}
            grade={listing.grade}
          />
        ))}
        {listings.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>📭 No listings yet</Text>
          </View>
        )}

        <View style={{ height: spacing.huge }} />
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.h2,
    color: colors.text,
    marginTop: -2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22 },
  statsRow: {
    flexDirection: 'row', gap: spacing.sm,
    marginTop: spacing.md,
  },
  statPill: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
  },
  statPillText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  scroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },

  voicePrompt: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  voiceIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  voiceIcon: { fontSize: 20 },
  voicePromptText: { flex: 1 },
  voicePromptTitle: {
    ...typography.h4,
    color: colors.text,
  },
  voicePromptSub: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 1,
  },
  chevronRight: {
    fontSize: 18, color: colors.textMuted,
  },

  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  quickCard: {
    width: (SCREEN_W - spacing.xxl * 2 - spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: {
    ...typography.small,
    color: colors.text, fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  sectionLink: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },

  priceRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  pricePill: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  pricePillEmoji: { fontSize: 20 },
  pricePillName: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pricePillValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  trendBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  trendText: {
    ...typography.caption,
    fontWeight: '700',
  },

  farmHealthRow: {
    flexDirection: 'row', gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  farmHealthCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },

  emptyRow: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
})
