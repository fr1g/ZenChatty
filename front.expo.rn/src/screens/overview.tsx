import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from './../components/ScreenContent';

import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';

export default function Overview() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScreenContent path="screens/overview.tsx" title="Overview"></ScreenContent>
      <Button
        onPress={() => Alert.alert("hi")}
        title="Show Details"
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
