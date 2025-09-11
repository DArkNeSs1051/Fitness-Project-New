import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const BottomNavigator: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = (tabRoute: string) => {
    const targetPath = `/${tabRoute.toLowerCase()}`;
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
  };

  const tabs: { name: string; route: string; icon: IoniconName }[] = [
    { name: "Routines",  route: "routines",  icon: "calendar" },
    { name: "Library",   route: "library",   icon: "body" },
    { name: "Workout",   route: "workout",   icon: "barbell" },
    { name: "Nutrition", route: "nutrition", icon: "nutrition" },
    { name: "Account",   route: "account",   icon: "person" },
  ];

  return (
    <SafeAreaView className="bg-[#84BDEA] items-center pb-4">
      <View style={styles.shadowWrapper}>
        <View style={styles.tabContainer}>
          {tabs.map((tab, index) => {
            const targetPath = `/${tab.route}`;
            const isActive = pathname === targetPath;
            const isFirst = index === 0;
            const isLast = index === tabs.length - 1;

            return (
              <TouchableOpacity
                key={tab.route}
                className={`flex-1 items-center py-3 ${isActive ? "bg-[#5FA3D6]" : ""} ${
                  isFirst ? "rounded-l-[12px]" : ""
                } ${isLast ? "rounded-r-[12px]" : ""}`}
                onPress={() => handleTabPress(tab.route)}
                disabled={isActive}
                style={{ opacity: isActive ? 0.8 : 1 }}
              >
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={isActive ? "#42779F" : "white"}
                />
                <Text className={`text-xs mt-1 ${isActive ? "text-[#42779F]" : "text-white"}`}>
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
    backgroundColor: "transparent",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#42779F",
    borderRadius: 12,
    overflow: "hidden",
  },
});

export default BottomNavigator;
