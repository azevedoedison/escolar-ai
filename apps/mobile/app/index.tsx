import { Text, View } from 'react-native';
import { APP_NAME } from '@tata/shared';

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{APP_NAME}</Text>
    </View>
  );
}
