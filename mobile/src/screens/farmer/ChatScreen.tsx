import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, StatusBar,
  ScrollView, TextInput, TouchableOpacity,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, typography, shadows } from '../../theme'
import { useAppSelector } from '../../hooks/useAppDispatch'
import { api } from '../../services/api'
import { Conversation, Message } from '../../types'

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const { user } = useAppSelector((s) => s.auth)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    api.getConversations().then(setConversations).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeConvId) {
      api.getMessages(activeConvId).then(setMessages).catch(() => {})
    }
  }, [activeConvId])

  async function handleSend() {
    const text = input.trim()
    if (!text || !activeConvId) return
    setInput('')

    const conv = conversations.find((c) => c.id === activeConvId)
    if (!conv) return
    const receiverId = conv.buyerId === user?.id ? conv.farmerId : conv.buyerId

    try {
      const msg = await api.sendMessage({
        conversationId: activeConvId,
        receiverId,
        content: text,
        sourceLanguage: user?.language || 'rw',
      })
      setMessages((prev) => [...prev, msg])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } catch {}
  }

  if (activeConvId) {
    const conv = conversations.find((c) => c.id === activeConvId)
    const otherName = conv
      ? (conv.buyerId === user?.id ? conv.farmerName : conv.buyerName)
      : ''

    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <View style={styles.chatTopBar}>
          <TouchableOpacity onPress={() => setActiveConvId(null)} activeOpacity={0.8}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <View style={styles.chatTopBarInfo}>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>👤</Text>
            </View>
            <Text style={styles.chatTopBarName}>{otherName}</Text>
          </View>
          <View style={styles.translationBadge}>
            <Text style={styles.translationBadgeText}>ZH → RW</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesScroll}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id
            return (
              <View key={msg.id} style={[
                styles.msgRow,
                isMe ? styles.msgRowMe : styles.msgRowOther,
              ]}>
                <View style={[
                  styles.msgBubble,
                  isMe ? styles.msgBubbleMe : styles.msgBubbleOther,
                ]}>
                  <Text style={[
                    styles.msgText,
                    isMe && styles.msgTextMe,
                  ]}>
                    {msg.content}
                  </Text>
                  {msg.contentOriginal && msg.contentOriginal !== msg.content && (
                    <Text style={styles.msgOriginal}>{msg.contentOriginal}</Text>
                  )}
                </View>
              </View>
            )
          })}
          <View style={{ height: spacing.huge }} />
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Messages</Text>
        <Text style={styles.headerSub}>Auto-translated conversations</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.convScroll}
        showsVerticalScrollIndicator={false}
      >
        {conversations.map((conv) => {
          const otherName = conv.buyerId === user?.id ? conv.farmerName : conv.buyerName
          const otherRole = conv.buyerId === user?.id ? 'Farmer' : 'Buyer'
          return (
            <TouchableOpacity
              key={conv.id}
              style={styles.convCard}
              onPress={() => setActiveConvId(conv.id)}
              activeOpacity={0.8}
            >
              <View style={styles.convAvatar}>
                <Text style={styles.convAvatarText}>👤</Text>
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convTopRow}>
                  <Text style={styles.convName}>{otherName}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {otherRole === 'Buyer' ? '🇨🇳 Buyer' : '🌍 Farmer'}
                    </Text>
                  </View>
                </View>
                {conv.listingTitle && (
                  <Text style={styles.convListing}>Re: {conv.listingTitle}</Text>
                )}
                {conv.lastMessage && (
                  <Text style={styles.convLastMsg} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                )}
              </View>
              {conv.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
        {conversations.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>
              Messages from buyers will appear here
            </Text>
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

  convScroll: {
    paddingHorizontal: spacing.xxl,
  },
  convCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  convAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${colors.info}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  convAvatarText: { fontSize: 20 },
  convInfo: { flex: 1 },
  convTopRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  convName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  roleBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.primary, fontWeight: '600',
  },
  convListing: {
    ...typography.small,
    color: colors.textMuted, marginTop: 1,
  },
  convLastMsg: {
    ...typography.small,
    color: colors.textSecondary, marginTop: 2,
  },
  unreadBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadText: {
    ...typography.caption,
    color: colors.textOnPrimary, fontWeight: '700',
    fontSize: 10,
  },

  chatTopBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.md,
    ...shadows.sm,
  },
  backBtn: {
    fontSize: 22, color: colors.text,
    padding: spacing.xs,
  },
  chatTopBarInfo: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  chatAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: `${colors.info}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  chatAvatarText: { fontSize: 16 },
  chatTopBarName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  translationBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  translationBadgeText: {
    ...typography.caption,
    color: colors.primary, fontWeight: '700',
  },

  messagesScroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  msgRow: {
    flexDirection: 'row', marginBottom: spacing.sm,
    maxWidth: '85%',
  },
  msgRowMe: { alignSelf: 'flex-end' },
  msgRowOther: { alignSelf: 'flex-start' },
  msgBubble: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  msgBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  msgText: {
    ...typography.body,
    color: colors.text,
  },
  msgTextMe: { color: colors.textOnPrimary },
  msgOriginal: {
    ...typography.small,
    color: colors.textMuted, fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.round,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  textInput: {
    ...typography.body,
    color: colors.text,
    paddingVertical: 10, paddingHorizontal: spacing.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 16, color: colors.textOnPrimary },

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
