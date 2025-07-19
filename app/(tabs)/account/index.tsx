import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { shadows } from "~/utils/shadow";
import { useClerk, useUser } from "@clerk/clerk-expo";

export default function AccountScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const MenuItem = ({
    icon,
    label,
    route,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between bg-[#2c5575] p-4 mb-4 "
      style={shadows.medium}
      onPress={onPress ?? (() => route && router.push(route))}
    >
      <View className="flex-row items-center space-x-3">
        <View className="mr-5 bg-[#42779F] rounded-[10]">
          <Ionicons className="m-2" name={icon} size={24} color="#FFFFFF" />
        </View>
        <Text className="text-base text-[#FFFFFF]">{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth");
    } catch (err: any) {
      alert(err.message || "Sign out error");
    }
  };

  return (
    <View className="flex-1 bg-[#84BDEA] px-4 py-4">
      <View className="bg-[#42779F] rounded-[12] flex-1" style={shadows.large}>
        <View className="border-b-[2px] border-[#84BDEA] mt-5 mb-4">
          <Text className="text-center text-white text-xl font-semibold mt-6 mb-6">
            Hi, {user?.emailAddresses[0]?.emailAddress || "-"}
          </Text>
        </View>

        <MenuItem
          icon="person-outline"
          label="My Profile"
          route="account/profile"
        />
        <MenuItem
          icon="barbell-outline"
          label="Fitness Test"
          route="account/fitnessTest"
        />
        <MenuItem
          icon="construct-outline"
          label="Generate Workout Plan"
          route="account/generatePlan"
        />
        <MenuItem
          icon="time-outline"
          label="Program History"
          route="account/programHistory"
        />
        <MenuItem
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleSignOut}
        />
      </View>
    </View>
  );
}
