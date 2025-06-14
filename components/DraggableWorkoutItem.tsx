// components/DraggableWorkoutItem.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

interface DraggableWorkoutItemProps {
  item: any;
  isEditing: boolean;
  onDrag: (offsetY: number) => void;
  onDragEnd: () => void;
}

const DraggableWorkoutItem = ({
  item,
  isEditing,
  onDrag,
  onDragEnd,
}: DraggableWorkoutItemProps) => {
  const offsetY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      offsetY.value = e.translationY;
      onDrag(e.translationY);
    })
    .onEnd(() => {
      offsetY.value = withSpring(0);
      onDragEnd();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[animatedStyle, { paddingVertical: 8, flexDirection: "row", alignItems: "center" }]}
        className="border-b border-gray-400"
      >
        {isEditing && (
          <Ionicons
            name="menu-outline"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
        )}
        <Text className="text-white flex-1">{item.exercise}</Text>
        <Text className="text-white flex-1">{item.target}</Text>
        <Text className="text-white flex-[0.6] text-center">{item.reps}</Text>
        <Text className="text-white flex-[0.6] text-center">{item.sets}</Text>
        <Text className="text-white flex-[0.6] text-center">{item.rest}</Text>
        {isEditing && (
          <View className="w-12 flex-row ml-2">
            <TouchableOpacity className="mr-2">
              <Ionicons name="pencil" size={20} color="#84BDEA" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="trash" size={20} color="#E63946" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

export default DraggableWorkoutItem;
