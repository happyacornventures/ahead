import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { GestureResponderEvent } from "react-native";
import {
  Button,
  View
} from "tamagui";

import { BaseDetails, BaseForm, BaseList, BottomDrawer } from "./components/BaseComponents";

// eventually this should be split based on platform as well--this is only true for web
const dispatch = (event: string, payload: Record<string, unknown>) =>
  window.__TAURI_INTERNALS__
    ? invoke("dispatch", {
        event,
        payload: JSON.stringify(payload),
      }).then((rsp) => JSON.parse(rsp as string))
    : Promise.resolve({ node: {} });

export default function Index() {
  const [nodes, setNodes] = useState<Record<string, Record<string, unknown>>>(
    {},
  );
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    dispatch("app_started", {})
      .then((data) => setNodes(data?.node))
      .catch(console.error);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BottomDrawer
        open={isSheetOpen}
        onOpenChange={(arg) => {
          setSheetOpen(arg);
          setActiveNode(null);
        }}
      >
        {activeNode && <BaseDetails node={nodes[activeNode ?? ""]} />}
        <BaseForm
          schema={{
            title: activeNode ? "Edit Node" : "Create Node",
            properties: {
              slug: {
                type: "string",
                title: "Slug",
                value: (nodes[activeNode ?? ""]?.slug as string) ?? "",
              },
            },
          }}
          onSubmit={
            activeNode
              ? ({ slug }) =>
                  dispatch("node_updated", { id: activeNode, slug })
                    .then((data) => setNodes(data?.node))
                    .then(() => setSheetOpen(false))
              : ({ slug }) =>
                  dispatch("node_created", { slug })
                    .then((data) => setNodes(data?.node))
                    .then(() => setSheetOpen(false))
          }
        />
      </BottomDrawer>
      {(nodes ?? {}) && (
        <BaseList
          nodes={Object.values(nodes).map((node) => ({
            ...node,
            onPress: () => {
              setActiveNode(node.id as string);
              setSheetOpen(true);
            },
            actions: {
              delete: (e: GestureResponderEvent) => {
                e.stopPropagation();
                dispatch("node_deleted", { id: node.id as string }).then(
                  (data) => setNodes(data?.node),
                );
              },
            },
          }))}
          targetKey="slug"
          width="100%"
        />
      )}
      <Button
        theme="blue"
        onPress={() => setSheetOpen(true)}
        position="absolute"
        top="$3"
        right="$3"
        size="$2"
      >
        New Node
      </Button>
    </View>
  );
}
