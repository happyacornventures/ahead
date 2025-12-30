import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'

import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'

const tamaguiConfig = createTamagui(defaultConfig)

type Conf = typeof tamaguiConfig

// make imports typed
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
export default function RootLayout() {
  return <Stack
    screenOptions={{
      headerShown: false, // This will hide the header for all screens
    }}
  />;
}
