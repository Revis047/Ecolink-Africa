import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, typography, shadows } from '../theme'

import { VillageSquareScreen } from '../screens/farmer/VillageSquareScreen'
import { VoiceInquiryScreen } from '../screens/farmer/VoiceInquiryScreen'
import { CropScannerScreen } from '../screens/farmer/CropScannerScreen'
import { MarketScreen } from '../screens/farmer/MarketScreen'
import { ChatScreen } from '../screens/farmer/ChatScreen'
import { useAppSelector } from '../hooks/useAppDispatch'

type TabIcon = { focused: boolean; color: string; size: number }

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const TAB_ICONS: Record<string, string> = {
  VillageSquare: '🏘️',
  VoiceInquiry: '🎤',
  CropScanner: '📷',
  Market: '📊',
  Chat: '💬',
}

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {TAB_ICONS[routeName] || '🌿'}
      </Text>
    </View>
  )
}

const SCREEN_WIDTH = Dimensions.get('window').width
const IS_SMALL_SCREEN = SCREEN_WIDTH < 360

function FarmerTabs() {
  const insets = useSafeAreaInsets()

  const barStyle = {
    ...tabStyles.bar,
    paddingBottom: Math.max(insets.bottom, 8),
    height: 56 + Math.max(insets.bottom, 8),
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: tabStyles.label,
        tabBarStyle: barStyle,
        tabBarShowLabel: !IS_SMALL_SCREEN,
        tabBarItemStyle: tabStyles.item,
      })}
    >
      <Tab.Screen
        name="VillageSquare"
        component={VillageSquareScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="VoiceInquiry"
        component={VoiceInquiryScreen}
        options={{ tabBarLabel: 'Voice' }}
      />
      <Tab.Screen
        name="CropScanner"
        component={CropScannerScreen}
        options={{ tabBarLabel: 'Scan' }}
      />
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{ tabBarLabel: 'Market' }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
    </Tab.Navigator>
  )
}

export const AppNavigator: React.FC = () => {
  const { onboardingComplete } = useAppSelector((s) => s.auth)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : null}
      <Stack.Screen name="FarmerHome" component={FarmerTabs} />
    </Stack.Navigator>
  )
}

import { OnboardingScreen } from '../screens/auth/OnboardingScreen'

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 6,
    ...shadows.sm,
  },
  item: {
    paddingVertical: 0,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: `${colors.primary}15`,
  },
  icon: { fontSize: 20, opacity: 0.5 },
  iconActive: { opacity: 1 },
  label: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: -2,
    fontSize: IS_SMALL_SCREEN ? 9 : 11,
  },
})
