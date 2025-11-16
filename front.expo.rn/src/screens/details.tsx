import { useRoute, type StaticScreenProps } from '@react-navigation/native';
import { ScreenContent } from './../components/ScreenContent';

import { StyleSheet, View } from 'react-native';


export default function Details() { // { route }: Props
  const route = useRoute();
  return (
    <View className='bg-emerald-300' style={styles.container}>
      <ScreenContent
        path="screens/details.tsx"
        title={`Showing path: ${route.key}`}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
