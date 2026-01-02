import { View } from "react-native";

import { Button, ListItem, Text } from 'tamagui';

import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from "react";

function Demo() {
  return <Button theme="blue">Hello world</Button>
}

export default function Index() {
  const [nodes, setNodes] = useState<Record<string, unknown>>({});

  useEffect(() => {
    invoke("dispatch", { event: "AppStarted" }).then(rsp => JSON.parse(rsp as string)).then(setNodes).catch(console.error);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      {Object.values(nodes).map((node, index) => (<ListItem key={index}>{node}</ListItem>))}
      <Demo />
    </View>
  );
}
