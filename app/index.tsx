import { View } from "react-native";

import { Button, ListItem, Text } from 'tamagui';

import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from "react";

const createNode = (slug: string) => invoke("dispatch", { event: "node_created", payload: JSON.stringify({ slug }) });

function Demo() {
  return <Button theme="blue" onPress={() => createNode("example-slug")}>Hello world</Button>
}

export default function Index() {
  const [nodes, setNodes] = useState<Record<string, unknown>>({});

  useEffect(() => {
    invoke("dispatch", { event: "AppStarted" }).then(rsp => JSON.parse(rsp as string)).then(data => setNodes(data?.node)).catch(console.error);
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
      {Object.values(nodes).map((node, index) => (<ListItem key={index}>{(node as Record<string, unknown>)?.slug}</ListItem>))}
      <Button theme="blue" onPress={() => createNode("example-slug").then(rsp => JSON.parse(rsp as string)).then(data => setNodes(data?.node))}>Hello world</Button>
    </View>
  );
}
