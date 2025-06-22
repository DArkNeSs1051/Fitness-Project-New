import 'react-native-reanimated';
import "~/global.css";
import { Stack, usePathname } from "expo-router";
import BottomNavigator from "../navigation/BottomNavigator";
import { WorkoutProvider } from "../contexts/WorkoutContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

export default function RootLayout() {
  const pathname = usePathname();

  // Hide Bottom Navigator on specific screens
  const shouldHideBottomNav =
    pathname.startsWith("/workout/") ||
    pathname.startsWith("/exercise/") ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/auth");

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <WorkoutProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <SafeAreaView
              edges={["top", "bottom"]}
              className="flex flex-1 bg-[#84BDEA]"
            >
              {/* Stack Navigator */}
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
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
    </ClerkProvider>
  );
}
