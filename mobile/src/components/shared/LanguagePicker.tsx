import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native'
import { colors, spacing, borderRadius, typography } from '../../theme'

interface Language {
  code: string
  name: string
  emoji?: string
}

interface LanguagePickerProps {
  selected: string
  languages: Language[]
  onSelect: (code: string) => void
  label?: string
}

const FLAG_MAP: Record<string, string> = {
  rw: '🇷🇼', rn: '🇧🇮', ln: '🇨🇩', sw: '🇰🇪', lg: '🇺🇬',
  ha: '🇳🇬', yo: '🇳🇬', ig: '🇳🇬', am: '🇪🇹', om: '🇪🇹',
  ti: '🇪🇷', so: '🇸🇴', zu: '🇿🇦', xh: '🇿🇦', af: '🇿🇦',
  st: '🇱🇸', tn: '🇧🇼', sn: '🇿🇼', nd: '🇿🇼',   ss: '🇸🇿', ve: '🇿🇦',
  ts: '🇿🇦', nr: '🇿🇦', nso: '🇿🇦', ki: '🇰🇪', luo: '🇰🇪',
  bem: '🇿🇲', ny: '🇲🇼', mg: '🇲🇬', sg: '🇨🇫', bm: '🇲🇱',
  wo: '🇸🇳', ff: '🇸🇳', kri: '🇸🇱', men: '🇸🇱', tem: '🇸🇱',
  dyu: '🇨🇮', mos: '🇧🇫', ee: '🇬🇭', tw: '🇬🇭', gaa: '🇬🇭',
  dag: '🇬🇭', kbp: '🇹🇬', kdh: '🇹🇬', ber: '🇲🇦', ar: '🇪🇬',
  pt: '🇵🇹', es: '🇪🇸', fr: '🇫🇷', zh: '🇨🇳', en: '🇬🇧',
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  selected, languages, onSelect, label,
}) => {
  const [visible, setVisible] = useState(false)
  const current = languages.find((l) => l.code === selected)

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.flag}>
          {FLAG_MAP[selected] || '🌍'}
        </Text>
        <Text style={styles.triggerText}>
          {current?.name || selected}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {label || 'Select Language'}
              </Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === selected
                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => {
                      onSelect(item.code)
                      setVisible(false)
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionFlag}>
                      {FLAG_MAP[item.code] || '🌍'}
                    </Text>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionName}>{item.name}</Text>
                      <Text style={styles.optionCode}>{item.code}</Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  flag: { fontSize: 22 },
  triggerText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  chevron: {
    fontSize: 10,
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.huge,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetTitle: {
    ...typography.h4,
    color: colors.text,
  },
  closeBtn: {
    fontSize: 18,
    color: colors.textMuted,
    padding: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  optionSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  optionFlag: { fontSize: 24 },
  optionInfo: { flex: 1 },
  optionName: {
    ...typography.body,
    color: colors.text,
  },
  optionCode: {
    ...typography.small,
    color: colors.textMuted,
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
})
