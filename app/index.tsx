import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Button, H2, ListItem, Paragraph, Sheet, View } from "tamagui";

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
  onSubmit: () => void;
}) => {
  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85]}
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
        <Button size="$6" onPress={onSubmit}>
          Create Node
        </Button>
      </Sheet.Frame>
    </Sheet>
  );
};

export default function Index() {
  const [nodes, setNodes] = useState<Record<string, unknown>>({});
  const [isSheetOpen, setSheetOpen] = useState(false);

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
        onSubmit={() =>
          createNode("example-slug")
            .then((rsp) => JSON.parse(rsp as string))
            .then((data) => setNodes(data?.node))
        }
      />
      {Object.values(nodes).map((node, index) => (
        <ListItem key={index}>
          {(node as Record<string, unknown>)?.slug}
        </ListItem>
      ))}
      <Button theme="blue" onPress={() => setSheetOpen(true)}>
        Hello world
      </Button>
    </View>
  );
}
