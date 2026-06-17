import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, StatusBar,
  Animated, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { colors, spacing, borderRadius, typography, shadows } from '../../theme'
import { useAppSelector } from '../../hooks/useAppDispatch'
import { api } from '../../services/api'

const { width: SCREEN_W } = Dimensions.get('window')
const IS_SMALL = SCREEN_W < 375
const CONTENT_MAX_W = Math.min(SCREEN_W - spacing.xxl * 2, 680)
const THINKING_STEPS = ['🧠', '🔍', '🌐', '✍️']
const THINKING_LABELS = ['Think', 'Search', 'Gather', 'Write']

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
  isTyping?: boolean
  displayedText?: string
}

export const VoiceInquiryScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const { user } = useAppSelector((s) => s.auth)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputText, setInputText] = useState('')
  const [thinkingStep, setThinkingStep] = useState(0)

  const recordingRef = useRef<Audio.Recording | null>(null)
  const soundRef = useRef<Audio.Sound | null>(null)
  const scrollRef = useRef<ScrollView>(null)
  const thinkingTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    })
    return () => {
      recordingRef.current?.stopAndUnloadAsync()
      soundRef.current?.unloadAsync()
      if (thinkingTimer.current) clearInterval(thinkingTimer.current)
    }
  }, [])

  useEffect(() => {
    if (isProcessing) {
      setThinkingStep(0)
      thinkingTimer.current = setInterval(() => {
        setThinkingStep((p) => (p < THINKING_STEPS.length - 1 ? p + 1 : p))
      }, 800)
    } else {
      if (thinkingTimer.current) clearInterval(thinkingTimer.current)
      thinkingTimer.current = null
    }
    return () => {
      if (thinkingTimer.current) clearInterval(thinkingTimer.current)
    }
  }, [isProcessing])

  function addMessage(role: 'user' | 'assistant', text: string, isTyping = false) {
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      role, text, timestamp: Date.now(), isTyping, displayedText: isTyping ? '' : text,
    }
    setMessages((prev) => [...prev, msg])
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    if (isTyping) animateTyping(msg.id, text)
  }

  function animateTyping(msgId: string, fullText: string) {
    let idx = 0
    const speed = 25
    const iv = setInterval(() => {
      idx++
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, displayedText: fullText.slice(0, idx) } : m
        )
      )
      if (idx >= fullText.length) {
        clearInterval(iv)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, isTyping: false, displayedText: fullText } : m
          )
        )
      }
    }, speed)
  }

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync()
      if (!granted) return
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      })
      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await recording.startAsync()
      recordingRef.current = recording
      setIsListening(true)
    } catch {
      addMessage('assistant', 'Could not start recording. Please check microphone permissions.')
    }
  }

  async function stopRecording() {
    try {
      const recording = recordingRef.current
      if (!recording) return
      setIsListening(false)
      setIsProcessing(true)
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      recordingRef.current = null
      if (!uri) throw new Error('No recording URI')
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const lang = user?.language || 'rw'
      const result = await api.voiceInquiry(base64, lang, conversationId || undefined)
      if (result.conversationId) setConversationId(result.conversationId)
      addMessage('user', result.transcribedText)
      addMessage('assistant', result.responseText, true)
      if (result.responseAudioBase64) {
        try {
          const audioUri = FileSystem.cacheDirectory + 'response_' + Date.now() + '.wav'
          await FileSystem.writeAsStringAsync(audioUri, result.responseAudioBase64, {
            encoding: FileSystem.EncodingType.Base64,
          })
          const sound = new Audio.Sound()
          await sound.loadAsync({ uri: audioUri })
          await sound.playAsync()
          soundRef.current = sound
        } catch {}
      }
    } catch (e: any) {
      const status = e?.response?.status
      const detail = e?.response?.data?.detail || e?.message || ''
      if (status === 401 || detail.includes('401') || detail.includes('token') || detail.includes('auth')) {
        addMessage('assistant', 'Session expired. Please log in again.')
      } else if (status === 413) {
        addMessage('assistant', 'Recording too long. Please try a shorter message.')
      } else if (status === 422) {
        addMessage('assistant', 'Could not process audio. Please try speaking more clearly.')
      } else if (status && status >= 500) {
        addMessage('assistant', 'Server error. Please try again in a moment.')
      } else if (detail && typeof detail === 'string' && detail.includes('connect')) {
        addMessage('assistant', 'Cannot reach server. Check your internet connection.')
      } else {
        addMessage('assistant', 'Connection issue. Please try again.')
      }
    }
    setIsProcessing(false)
  }

  async function handleVoicePress() {
    if (isListening) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  async function handleSendText() {
    const text = inputText.trim()
    if (!text) return
    setInputText('')
    addMessage('user', text)
    setIsProcessing(true)
    try {
      const lang = user?.language || 'rw'
      const result = await api.chat(text, lang, conversationId || undefined)
      if (result.conversationId) setConversationId(result.conversationId)
      addMessage('assistant', result.responseText, true)
      if (result.responseAudioBase64) {
        try {
          const audioUri = FileSystem.cacheDirectory + 'response_' + Date.now() + '.wav'
          await FileSystem.writeAsStringAsync(audioUri, result.responseAudioBase64, {
            encoding: FileSystem.EncodingType.Base64,
          })
          const sound = new Audio.Sound()
          await sound.loadAsync({ uri: audioUri })
          await sound.playAsync()
          soundRef.current = sound
        } catch {}
      }
    } catch (e: any) {
      const status = e?.response?.status
      const detail = e?.response?.data?.detail || e?.message || ''
      if (status === 401 || detail.includes('401')) {
        addMessage('assistant', 'Session expired. Please log in again.')
      } else if (status && status >= 500) {
        addMessage('assistant', 'Server error. Please try again in a moment.')
      } else if (typeof detail === 'string' && detail.includes('connect')) {
        addMessage('assistant', 'Cannot reach server. Check your internet connection.')
      } else {
        addMessage('assistant', detail || 'Connection issue. Please try again.')
      }
    }
    setIsProcessing(false)
  }

  function handleNewChat() {
    setMessages([])
    setConversationId(null)
  }

  const isEmpty = messages.length === 0 && !isListening && !isProcessing

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.statusDot} />
            <Text style={styles.topBarTitle}>AI Assistant</Text>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleNewChat} activeOpacity={0.8}>
              <Text style={styles.newChatBtn}>+ New</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isEmpty && (
            <View style={styles.hero}>
              <Text style={styles.heroEmoji}>🌾</Text>
              <Text style={styles.heroTitle}>Ask me about farming</Text>
              <Text style={styles.heroSub}>Crops · Weather · Prices · Diseases</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestions}
              >
                {[
                  { icon: '🌽', text: 'Plant maize?' },
                  { icon: '💰', text: 'Avocado price?' },
                  { icon: '🐛', text: 'Cassava disease?' },
                  { icon: '🌤', text: 'Rain this week?' },
                ].map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionPill}
                    onPress={() => setInputText(s.text)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.suggestionIcon}>{s.icon}</Text>
                    <Text style={styles.suggestionText}>{s.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {isListening && (
            <View style={styles.listeningBox}>
              <View style={styles.waveRow}>
                {[...Array(5)].map((_, i) => (
                  <WaveBar key={i} index={i} />
                ))}
              </View>
              <Text style={styles.listeningText}>Listening... tap mic to stop</Text>
            </View>
          )}

          {messages.map((msg) => (
            <View key={msg.id} style={[
              styles.msgRow,
              msg.role === 'user' ? styles.msgRowUser : styles.msgRowAI,
            ]}>
              {msg.role === 'assistant' && (
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>🌍</Text>
                </View>
              )}
              <View style={[
                styles.msgBubble,
                msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleAI,
              ]}>
                {msg.role === 'assistant' && (
                  <Text style={styles.msgLabel}>EcoLink AI</Text>
                )}
                <Text style={[
                  styles.msgText,
                  msg.role === 'user' && styles.msgTextUser,
                ]}>
                  {msg.isTyping ? msg.displayedText : msg.text}
                  {msg.isTyping && <Text style={styles.typingCursor}>|</Text>}
                </Text>
              </View>
            </View>
          ))}

          {isProcessing && (
            <View style={styles.thinkingBox}>
              {THINKING_STEPS.map((step, i) => (
                <View key={i} style={styles.thinkingStep}>
                  <View style={[
                    styles.thinkingDot,
                    i < thinkingStep && styles.thinkingDotDone,
                    i === thinkingStep && styles.thinkingDotActive,
                    i > thinkingStep && styles.thinkingDotFuture,
                  ]}>
                    <Text style={styles.thinkingStepIcon}>
                      {i < thinkingStep ? '✓' : step}
                    </Text>
                  </View>
                  <Text style={[
                    styles.thinkingLabel,
                    i > thinkingStep && styles.thinkingLabelFaded,
                  ]}>
                    {THINKING_LABELS[i]}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: spacing.huge }} />
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TouchableOpacity
            style={styles.micBtn}
            onPress={handleVoicePress}
            activeOpacity={0.8}
          >
            <Text style={styles.micIcon}>{isListening ? '🔊' : '🎤'}</Text>
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about farming..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={handleSendText}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSendText}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const WaveBar: React.FC<{ index: number }> = ({ index }) => {
  const h = useRef(new Animated.Value(6)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(h, {
          toValue: 20 + Math.random() * 18,
          duration: 350 + Math.random() * 250,
          useNativeDriver: false,
        }),
        Animated.timing(h, {
          toValue: 6 + Math.random() * 8,
          duration: 350 + Math.random() * 250,
          useNativeDriver: false,
        }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])
  return <Animated.View style={[styles.waveBar, { height: h }]} />
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primaryLight,
  },
  topBarTitle: {
    ...typography.h4,
    color: colors.text,
  },
  newChatBtn: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },

  scroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    maxWidth: CONTENT_MAX_W,
    alignSelf: 'center',
    width: '100%',
  },

  hero: { alignItems: 'center', paddingTop: spacing.xxxl, paddingBottom: spacing.xl },
  heroEmoji: { fontSize: 64, marginBottom: spacing.lg },
  heroTitle: {
    ...typography.h2,
    color: colors.text, textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSub: {
    ...typography.body,
    color: colors.textSecondary, textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  suggestions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  suggestionPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  suggestionIcon: { fontSize: 16 },
  suggestionText: {
    ...typography.small,
    color: colors.text, fontWeight: '600',
  },

  listeningBox: {
    alignItems: 'center', paddingVertical: spacing.xxxl,
  },
  waveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: spacing.lg, height: 40,
  },
  waveBar: {
    width: 4, backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  listeningText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  msgRow: {
    flexDirection: 'row', marginBottom: spacing.md,
    maxWidth: '88%', alignItems: 'flex-end',
  },
  msgRowUser: { alignSelf: 'flex-end' },
  msgRowAI: { alignSelf: 'flex-start' },

  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm, marginBottom: 4,
  },
  aiAvatarText: { fontSize: 14 },

  msgBubble: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    maxWidth: '100%',
  },
  msgBubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleAI: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  msgLabel: {
    ...typography.caption,
    color: colors.secondary, marginBottom: 2,
    fontWeight: '700',
  },
  msgText: {
    ...typography.body,
    color: colors.text,
  },
  msgTextUser: { color: colors.textOnPrimary },
  typingCursor: {
    color: colors.secondary, fontWeight: '700',
    opacity: 0.7,
  },

  thinkingBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    gap: spacing.md,
    alignSelf: 'center',
    ...shadows.sm,
  },
  thinkingStep: { alignItems: 'center', gap: 4 },
  thinkingDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  thinkingDotActive: { backgroundColor: colors.secondary },
  thinkingDotDone: { backgroundColor: colors.success },
  thinkingDotFuture: { backgroundColor: colors.borderLight },
  thinkingStepIcon: { fontSize: 12 },
  thinkingLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  thinkingLabelFaded: { color: colors.textMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  micIcon: { fontSize: 18 },
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
})
