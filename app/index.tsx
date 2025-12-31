import { Text, View } from "react-native";

import { Button } from 'tamagui';

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
