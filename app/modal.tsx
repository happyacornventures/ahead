
import { View, Text } from 'react-native';
import { useNavigation } from 'expo-router';
import { Button } from 'tamagui';

export default function ModalScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>This is a modal!</Text>
      <Button onPress={() => navigation.goBack()}>Close</Button>
    </View>
  );
}
