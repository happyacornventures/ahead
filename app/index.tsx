import { View } from "react-native";

import { Button, Text } from 'tamagui';

import { invoke } from '@tauri-apps/api/core';
import { useEffect } from "react";

function Demo() {
  return <Button theme="blue">Hello world</Button>
}

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Demo />
    </View>
  );
}
