import { X } from "@tamagui/lucide-icons";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Label,
  ListItem,
  Sheet,
  Text,
  View,
  XStack,
  YStack
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
  fieldKey,
  title,
  type,
  value,
  handleChange,
}: {
  fieldKey: string;
  title: string;
  type: string;
  value: unknown;
  handleChange: (key: string, value: unknown) => void;
}) => (
  <YStack key={fieldKey} gap="$2" marginVertical="$2">
    <Label htmlFor={fieldKey}>{title}</Label>
    <Input
      id={fieldKey}
      value={(value as string) || ""}
      onChange={(e) =>
        handleChange(fieldKey, (e.currentTarget as HTMLInputElement).value)
      }
      keyboardType={
        type === "number" || type === "integer" ? "numeric" : "default"
      }
    />
  </YStack>
);

const BaseForm = ({
  schema,
  onSubmit,
}: {
  schema: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Form onSubmit={() => onSubmit(formData)}>
      {schema.properties &&
        Object.entries(schema.properties).map(([key, property]) => (
          <FormField
            key={key}
            fieldKey={key}
            title={property.title || key}
            type={property.type || "text"}
            value={formData[key] || property.value || ""}
            handleChange={handleChange}
          />
        ))}
      <Form.Trigger asChild>
        <Button marginTop="$4">{schema.submitText || "Submit"}</Button>
      </Form.Trigger>
    </Form>
  );
};

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
}) => (
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
      <Button
        position="absolute"
        top="$3"
        right="$3"
        size="$2"
        circular
        icon={X}
        onPress={() => onOpenChange(false)}
      />
      {node &&
        Object.entries(node).map(([key, value]) => (
          <ListItem key={key}>{`${key}: ${value}`}</ListItem>
        ))}
      <BaseForm
        schema={{
          title: node ? "Edit Node" : "Create Node",
          properties: {
            slug: {
              type: "string",
              title: "Slug",
              value: (node?.slug as string) ?? "",
            },
          },
        }}
        onSubmit={(values) => {
          onSubmit(values.slug as string);
          onOpenChange(false);
        }}
      />
    </Sheet.Frame>
  </Sheet>
);

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
