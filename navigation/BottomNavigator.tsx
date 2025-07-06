import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

const BottomNavigator: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = (tabName: string) => {
    const targetPath = `/${tabName.toLowerCase()}`;

    // Only navigate if we're not already on that screen
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
  };

  const tabs = [
    { name: "Routines", icon: "calendar" },
    { name: "Library", icon: "body" },
    { name: "Workout", icon: "barbell" },
    { name: "DietPlan", icon: "nutrition" },
    { name: "Account", icon: "person" },
  ];

  return (
    <SafeAreaView className="bg-[#84BDEA] items-center pb-4">
      {/* Shadow wrapper */}
      <View style={styles.shadowWrapper}>
        {/* Inner container with overflow + rounded corners */}
        <View style={styles.tabContainer}>
          {tabs.map((tab, index) => {
            const isActive = pathname === `/${tab.name.toLowerCase()}`;
            const isFirst = index === 0;
            const isLast = index === tabs.length - 1;

            return (
              <TouchableOpacity
                key={tab.name}
                className={`flex-1 items-center py-3 ${
                  isActive ? "bg-[#5FA3D6]" : ""
                } ${isFirst ? "rounded-l-[12px]" : ""} ${
                  isLast ? "rounded-r-[12px]" : ""
                }`}
                onPress={() => handleTabPress(tab.name)}
                // Optional: Disable the button when already active
                disabled={isActive}
                // Optional: Reduce opacity when disabled
                style={{ opacity: isActive ? 0.8 : 1 }}
              >
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={isActive ? "#42779F" : "white"}
                />
                <Text
                  className={`text-xs mt-1 ${
                    isActive ? "text-[#42779F]" : "text-white"
                  }`}
                >
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    width: 350,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: "transparent", // Prevent gray box on Android
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#42779F",
    borderRadius: 12,
    overflow: "hidden", // Needed for rounding
  },
});

export default BottomNavigator;
