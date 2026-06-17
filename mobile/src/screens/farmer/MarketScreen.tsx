import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, StatusBar,
  ScrollView, TouchableOpacity, TextInput, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, typography, shadows } from '../../theme'
import { CropCard } from '../../components/shared/CropCard'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { fetchListings, checkPrice } from '../../store/slices/marketSlice'

const CATEGORIES = ['All', 'Fruits', 'Grains', 'Vegetables', 'Cash Crops']
const CATEGORY_EMOJI: Record<string, string> = {
  All: '🌾', Fruits: '🍎', Grains: '🌾', Vegetables: '🥬', 'Cash Crops': '💰',
}

const PRICE_CROPS = ['avocado', 'maize', 'coffee', 'cassava', 'mango', 'cashew', 'sesame', 'tea']
const PRICE_EMOJI: Record<string, string> = {
  avocado: '🥑', maize: '🌽', coffee: '☕', cassava: '🌱',
  mango: '🥭', cashew: '🥜', sesame: '🌾', tea: '🍵',
}

const SCREEN_W = Dimensions.get('window').width

export const MarketScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const { listings, priceCache } = useAppSelector((s) => s.market)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchListings())
  }, [])

  const filtered = listings.filter((l) => {
    if (activeCategory !== 'All' && l.category !== activeCategory) return false
    if (search) {
      const q = search.toLowerCase()
      if (!l.cropName.toLowerCase().includes(q) && !(l.cropNameZh || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Market</Text>
        <Text style={styles.headerSub}>Live prices from China-Africa trade</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tickerRow}
      >
        {PRICE_CROPS.map((crop) => {
          const data = priceCache[crop]
          return (
            <TouchableOpacity
              key={crop}
              style={styles.tickerCard}
              onPress={() => dispatch(checkPrice({ cropName: crop }))}
              activeOpacity={0.8}
            >
              <Text style={styles.tickerEmoji}>{PRICE_EMOJI[crop] || '🌿'}</Text>
              <Text style={styles.tickerName}>{crop}</Text>
              <Text style={styles.tickerPrice}>
                ${data ? data.priceUsd.toFixed(2) : '—'}
              </Text>
              {data && (
                <View style={[styles.tickerTrend, { backgroundColor: data.trend === 'up' ? `${colors.success}20` : `${colors.error}20` }]}>
                  <Text style={[styles.tickerTrendText, { color: data.trend === 'up' ? colors.success : colors.error }]}>
                    {data.trend === 'up' ? '▲' : '▼'} {Math.abs(data.percentageChange).toFixed(0)}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search crops..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryPill,
              activeCategory === cat && styles.categoryPillActive,
            ]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryIcon}>{CATEGORY_EMOJI[cat] || '🌿'}</Text>
            <Text style={[
              styles.categoryText,
              activeCategory === cat && styles.categoryTextActive,
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listings}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((listing) => (
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
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySub}>Check back soon for new crops</Text>
          </View>
        )}
        <View style={{ height: spacing.huge }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSub: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },

  tickerRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  tickerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
    minWidth: 100,
    gap: 2,
    ...shadows.sm,
  },
  tickerEmoji: { fontSize: 22 },
  tickerName: {
    ...typography.caption,
    color: colors.textSecondary, fontWeight: '600',
  },
  tickerPrice: {
    ...typography.bodyBold,
    color: colors.text,
  },
  tickerTrend: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  tickerTrendText: {
    ...typography.caption,
    fontWeight: '700',
  },

  searchRow: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 12,
  },

  categoryRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: { fontSize: 14 },
  categoryText: {
    ...typography.small,
    color: colors.text, fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.textOnPrimary,
  },

  listings: {
    paddingHorizontal: spacing.xxl,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    ...typography.h4,
    color: colors.text, marginBottom: spacing.xs,
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
  },
})
