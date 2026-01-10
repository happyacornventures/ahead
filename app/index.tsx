import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import {
  Button,
  H2,
  Input,
  Label,
  ListItem,
  Paragraph,
  Sheet,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

const createNode = (slug: string) =>
  invoke("dispatch", {
    event: "node_created",
    payload: JSON.stringify({ slug }),
  });

const updateNode = (node: Record<string, unknown>) =>
  invoke("dispatch", {
    event: "node_updated",
    payload: JSON.stringify(node),
  });

const deleteNode = (id: string) =>
  invoke("dispatch", {
    event: "node_deleted",
    payload: JSON.stringify({ id }),
  });

const FormField = ({
  key,
  title,
  type,
  value,
  handleChange,
}: {
  key: string;
  title: string;
  type: string;
  value: unknown;
  handleChange: (key: string, value: unknown) => void;
}) => (
  <YStack key={key} gap="$2" marginVertical="$2">
    <Label htmlFor={key}>{title}</Label>
    <Input
      id={key}
      value={(value as string) || ""}
      onChange={(e) =>
        handleChange(key, (e.currentTarget as HTMLInputElement).value)
      }
      keyboardType={
        type === "number" || type === "integer" ? "numeric" : "default"
      }
    />
  </YStack>
);

const SidebarSheet = ({
  open,
  onOpenChange,
  onSubmit,
  node,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (slug: string) => void;
  node: Record<string, unknown> | null;
}) => {
  const [slug, setSlug] = useState("");

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[100]}
      position={0}
      onPositionChange={() => {}} // onPositionChange is required
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame ai="center" jc="center">
        <Sheet.Handle />
        <H2>Sidebar Form</H2>
        <Paragraph>Put your form components here.</Paragraph>
        <Button size="$6" onPress={() => onOpenChange(false)}>
          Close
        </Button>
        {node &&
          Object.entries(node).map(([key, value]) => (
            <ListItem key={key}>{`${key}: ${value}`}</ListItem>
          ))}
        <FormField
          key="slug"
          title="slug"
          type="text"
          value={slug.length > 0 ? slug : ((node?.slug as string) ?? slug)}
          handleChange={(key, value) => setSlug(value as string)}
        />
        <Button
          size="$6"
          onPress={() => {
            onSubmit(slug);
            setSlug("");
            onOpenChange(false);
          }}
        >
          {node ? "Update" : "Create"} Node
        </Button>
      </Sheet.Frame>
    </Sheet>
  );
};

export default function Index() {
  const [nodes, setNodes] = useState<Record<string, Record<string, unknown>>>(
    {},
  );
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    invoke("dispatch", { event: "AppStarted" })
      .then((rsp) => JSON.parse(rsp as string))
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
      <SidebarSheet
        open={isSheetOpen}
        onOpenChange={(arg) => {
          setSheetOpen(arg);
          setActiveNode(null);
        }}
        onSubmit={
          activeNode
            ? (slug) =>
                updateNode({ id: activeNode, slug })
                  .then((rsp) => JSON.parse(rsp as string))
                  .then((data) => setNodes(data?.node))
            : (slug) =>
                createNode(slug)
                  .then((rsp) => JSON.parse(rsp as string))
                  .then((data) => setNodes(data?.node))
        }
        node={activeNode ? nodes[activeNode] : null}
      />
      {Object.values(nodes).map((node: Record<string, unknown>) => (
        <ListItem
          hoverTheme
          pressTheme
          key={node.id as string}
          onPress={() => {
            setActiveNode(node?.id as string);
            setSheetOpen(true);
          }}
        >
          <XStack flex={1} justifyContent="space-between" alignItems="center">
            <Text>{(node as Record<string, unknown>)?.slug}</Text>
            <Button
              theme="red"
              size="$2"
              onPress={(e) => {
                e.stopPropagation();
                deleteNode(node.id as string)
                  .then((rsp) => JSON.parse(rsp as string))
                  .then((data) => setNodes(data?.node));
              }}
            >
              Delete
            </Button>
          </XStack>
        </ListItem>
      ))}
      <Button theme="blue" onPress={() => setSheetOpen(true)}>
        Hello world
      </Button>
    </View>
  );
}
