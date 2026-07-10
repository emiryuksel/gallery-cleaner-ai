import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { PermissionScreen } from './src/screens/PermissionScreen';
import { SwipeScreen } from './src/screens/SwipeScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { theme } from './src/theme';
import { getStoredSession, clearSession } from './src/services/auth';
import type { GalleryItem } from './src/services/mediaLibrary';

type Route = { name: 'welcome' } | { name: 'permission' } | { name: 'swipe' } | { name: 'review' };

export default function App() {
  const [booting, setBooting] = React.useState(true);
  const [route, setRoute] = React.useState<Route>({ name: 'welcome' });
  const [toDelete, setToDelete] = React.useState<GalleryItem[]>([]);
  const [restoredQueue, setRestoredQueue] = React.useState<GalleryItem[]>([]);
  const [deletedIdsQueue, setDeletedIdsQueue] = React.useState<string[]>([]);
  const [galleryActive, setGalleryActive] = React.useState(false);

  React.useEffect(() => {
    getStoredSession().then((session) => {
      if (session) {
        setRoute({ name: 'permission' });
      }
      setBooting(false);
    });
  }, []);

  const openReview = () => setRoute({ name: 'review' });

  const handleReviewBack = (remaining: GalleryItem[], restored: GalleryItem[]) => {
    setToDelete(remaining);
    if (restored.length > 0) {
      setRestoredQueue(restored);
    }
    setRoute({ name: 'swipe' });
  };

  const handleDeleted = (deletedIds: string[]) => {
    setToDelete((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
    setDeletedIdsQueue(deletedIds);
    setRoute({ name: 'swipe' });
  };

  const handleLogout = async () => {
    await clearSession();
    setGalleryActive(false);
    setToDelete([]);
    setRestoredQueue([]);
    setDeletedIdsQueue([]);
    setRoute({ name: 'welcome' });
  };

  if (booting) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.root, styles.boot]}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />

          {route.name === 'welcome' ? (
            <WelcomeScreen onAuthenticated={() => setRoute({ name: 'permission' })} />
          ) : null}

          {route.name === 'permission' ? (
            <PermissionScreen
              onGranted={() => {
                setGalleryActive(true);
                setRoute({ name: 'swipe' });
              }}
            />
          ) : null}

          {galleryActive ? (
            <View style={styles.galleryStack}>
              <SwipeScreen
                toDelete={toDelete}
                onToDeleteChange={setToDelete}
                onReview={openReview}
                onLogout={handleLogout}
                restoredQueue={restoredQueue}
                onRestoredQueueHandled={() => setRestoredQueue([])}
                deletedIdsQueue={deletedIdsQueue}
                onDeletedIdsQueueHandled={() => setDeletedIdsQueue([])}
              />

              {route.name === 'review' ? (
                <ReviewScreen
                  style={styles.reviewOverlay}
                  items={toDelete}
                  onBack={handleReviewBack}
                  onDeleted={handleDeleted}
                />
              ) : null}
            </View>
          ) : null}
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
  boot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryStack: {
    flex: 1,
  },
  reviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});
