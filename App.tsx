import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PermissionScreen } from './src/screens/PermissionScreen';
import { SwipeScreen } from './src/screens/SwipeScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { theme } from './src/theme';
import type { GalleryItem } from './src/services/mediaLibrary';

type Route =
  | { name: 'permission' }
  | { name: 'swipe' }
  | { name: 'review'; toDelete: GalleryItem[] };

export default function App() {
  const [route, setRoute] = React.useState<Route>({ name: 'permission' });
  const [sessionKey, setSessionKey] = React.useState(0);

  const renderScreen = () => {
    switch (route.name) {
      case 'permission':
        return <PermissionScreen onGranted={() => setRoute({ name: 'swipe' })} />;
      case 'swipe':
        return (
          <SwipeScreen
            key={sessionKey}
            onReview={(toDelete) => setRoute({ name: 'review', toDelete })}
          />
        );
      case 'review':
        return (
          <ReviewScreen
            items={route.toDelete}
            onBack={() => setRoute({ name: 'swipe' })}
            onDeleted={() => {
              setSessionKey((k) => k + 1);
              setRoute({ name: 'swipe' });
            }}
          />
        );
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          {renderScreen()}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
