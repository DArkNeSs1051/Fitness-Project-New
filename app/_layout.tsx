import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '~/global.css';
import { Stack, usePathname } from 'expo-router';
import BottomNavigator from '../navigation/BottomNavigator';
import { WorkoutProvider } from '../contexts/WorkoutContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClerkProvider, useUser } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '~/store/useUserStore';
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { FIREBASE_APP } from '~/firebase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

async function signIntoFirebaseWithClerk() {
  const auth = getAuth(FIREBASE_APP);
  if (auth.currentUser) return auth.currentUser;

  const functions = getFunctions(FIREBASE_APP);
  const getToken = httpsCallable(functions, 'generateFirebaseCustomToken');
  const res: any = await getToken();
  const token = res?.data?.token;
  if (!token) throw new Error('No custom token returned');
  await signInWithCustomToken(auth, token);
  return auth.currentUser;
}

function UserRealtimeBridge() {
  const { user, isLoaded } = useUser();

  const listenUserDoc = useUserStore((s) => s.listenUserDoc);
  const stopListen     = useUserStore((s) => s.stopListen);
  const setUserData    = useUserStore((s) => s.setUserData);

  const [fbReady, setFbReady] = useState(false);
  useEffect(() => {
    const auth = getAuth(FIREBASE_APP);
    const unsub = onAuthStateChanged(auth, (u) => setFbReady(!!u));
    return unsub;
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.id) {
      stopListen();
      return;
    }
    signIntoFirebaseWithClerk().catch((e) => {
      console.warn('Firebase sign-in failed:', e);
    });
  }, [isLoaded, user?.id, stopListen]);

  useEffect(() => {
    if (!isLoaded || !user?.id || !fbReady) return;

    listenUserDoc(user.id);

    setUserData({
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    });

    return () => {
      stopListen();
    };
  }, [isLoaded, user?.id, fbReady, listenUserDoc, stopListen, setUserData]);

  return null; 
}

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });


export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#84BDEA');
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('workout-reminder', {
        name: 'Workout Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  }, []);

  const shouldHideBottomNav =
    pathname.startsWith('/workout/') ||
    pathname.startsWith('/exercise/') ||
    pathname.startsWith('/account/') ||
    pathname.startsWith('/auth') ||
    pathname === '/oauth-native-callback';

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <WorkoutProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <SafeAreaView edges={['top', 'bottom']} className="flex flex-1 bg-[#84BDEA]">
              <UserRealtimeBridge />

              <StatusBar backgroundColor="#84BDEA" style="dark" />

              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ title: 'Home' }} />
                <Stack.Screen name="(tabs)/routines" />
                <Stack.Screen name="(tabs)/library" />
                <Stack.Screen name="(tabs)/workout" />
                <Stack.Screen name="(tabs)/nutrition" />
                <Stack.Screen name="(tabs)/account/index" />
                <Stack.Screen name="workout/[id]" />
                <Stack.Screen name="workout/workoutSession" />
                <Stack.Screen name="exercise/[id]" />
              </Stack>

              {!shouldHideBottomNav && <BottomNavigator />}
              <Toast />
            </SafeAreaView>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </WorkoutProvider>
    </ClerkProvider>
  );
}
