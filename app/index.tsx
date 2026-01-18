import { X } from "@tamagui/lucide-icons";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { GestureResponderEvent } from "react-native";
import {
  Button,
  Form,
  H2,
  Input,
  Label,
  ListItem,
  Sheet,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

// eventually this should be split based on platform as well--this is only true for web
const dispatch = (event: string, payload: Record<string, unknown>) =>
  window.__TAURI_INTERNALS__
    ? invoke("dispatch", {
        event,
        payload: JSON.stringify(payload),
      }).then((rsp) => JSON.parse(rsp as string))
    : Promise.resolve({ node: {} });

const BaseFormField = ({
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
    <>
      {schema.title && <H2>{schema.title}</H2>}
      <Form
        onSubmit={() => {
          onSubmit(formData);
          setFormData({});
        }}
      >
        {schema.properties &&
          Object.entries(schema.properties).map(([key, property]) => (
            <BaseFormField
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
    </>
  );
};

const BottomDrawer = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
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
      {children}
    </Sheet.Frame>
  </Sheet>
);

const BaseListItem = ({ node }: { node: Record<string, unknown> }) => (
  <ListItem
    hoverTheme
    pressTheme
    key={node.id as string}
    onPress={(node.onPress as () => void) ?? (() => {})}
  >
    <XStack flex={1} justifyContent="space-between" alignItems="center">
      <Text>{(node as Record<string, unknown>)?.slug}</Text>
      {node.actions &&
        Object.entries(node.actions).map(([key, action]) => (
          <Button
            theme="red"
            size="$2"
            onPress={action as (e: unknown) => void}
          >
            {key}
          </Button>
        ))}
    </XStack>
  </ListItem>
);

const BaseList = ({
  nodes,
  ItemComponent = BaseListItem,
  ...styles
}: {
  nodes: Record<string, unknown>[];
  ItemComponent?: React.ComponentType<{ node: Record<string, unknown> }>;
} & Record<string, unknown>) => (
  <View {...styles}>
    {nodes.map((node) => (
      <ItemComponent key={node.id as string} node={node} />
    ))}
  </View>
);

const BaseDetails = ({ node }: { node: Record<string, unknown> }) => (
  <>
    {Object.entries(node ?? {}).map(([key, value]) => (
      <ListItem key={key}>{`${key}: ${value}`}</ListItem>
    ))}
  </>
);

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
