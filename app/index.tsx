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
  View,
} from "tamagui";

const createNode = (slug: string) =>
  invoke("dispatch", {
    event: "node_created",
    payload: JSON.stringify({ slug }),
  });

const SidebarSheet = ({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (slug: string) => void;
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
        <Label htmlFor="slug">slug</Label>
        <Input
          value={slug}
          id="slug"
          size="$4"
          borderWidth={2}
          onChange={(e) => setSlug((e.currentTarget as HTMLInputElement).value)}
        />
        <Button
          size="$6"
          onPress={() => {
            onSubmit(slug);
            setSlug("");
            onOpenChange(false);
          }}
        >
          Create Node
        </Button>
      </Sheet.Frame>
    </Sheet>
  );
};

export default function Index() {
  const [nodes, setNodes] = useState<Record<string, Record<string, unknown>>>({});
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
        onOpenChange={setSheetOpen}
        onSubmit={(slug) =>
          createNode(slug)
            .then((rsp) => JSON.parse(rsp as string))
            .then((data) => setNodes(data?.node))
        }
      />
      {Object.values(nodes).map((node: Record<string, unknown>, index: number) => (
        <ListItem
          hoverTheme
          pressTheme
          key={index}
          onPress={() => {
            setActiveNode(node?.id as string);
            setSheetOpen(true);
          }}
        >
          {(node as Record<string, unknown>)?.slug}
        </ListItem>
      ))}
      <Button theme="blue" onPress={() => setSheetOpen(true)}>
        Hello world
      </Button>
    </View>
  );
}
