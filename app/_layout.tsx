import 'react-native-reanimated';
import "~/global.css";
import { Stack, usePathname } from "expo-router";
import BottomNavigator from "../navigation/BottomNavigator";
import { WorkoutProvider } from '../contexts/WorkoutContext';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message'
import { useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const pathname = usePathname();
  const { width, height } = useWindowDimensions()

  // Hide Bottom Navigator on specific screens
  const shouldHideBottomNav = pathname.startsWith("/workout/") || pathname.startsWith("/exercise/") || pathname.startsWith("/account/"); // Hide on dynamic workout pages

  return (
    <WorkoutProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <SafeAreaView style={{ flex: 1, width, height, backgroundColor: '#84BDEA' }} edges={['top', 'bottom']}>
            {/* Stack Navigator */}
            <Stack screenOptions={{ headerShown: false }} >
              <Stack.Screen name="index" options={{ title: "Home" }} />
              <Stack.Screen name="(tabs)/routines" />
              <Stack.Screen name="(tabs)/library" />
              <Stack.Screen name="(tabs)/workout" />
              <Stack.Screen name="(tabs)/dietplan" />
              <Stack.Screen name="(tabs)/account/index" />
              <Stack.Screen name="workout/[id]" />
              <Stack.Screen name="exercise/[id]" />
            </Stack>

            {/* Show Bottom Navigator only on main screens */}
            {!shouldHideBottomNav && <BottomNavigator />}
            <Toast />
          </SafeAreaView>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </WorkoutProvider>
  );
}
