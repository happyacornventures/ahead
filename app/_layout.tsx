import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'

import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'

const tamaguiConfig = createTamagui(defaultConfig)

type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
      <Theme name="light">
        <Stack screenOptions={{ headerShown: false }} />
      </Theme>
    </TamaguiProvider>
  )
}
