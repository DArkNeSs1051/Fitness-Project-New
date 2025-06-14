import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { shadows } from "~/utils/shadow";

const HorizontalCalendar = ({ selectedDate, onSelectDate, workoutDays }) => {
  const [currentDate, setCurrentDate] = useState(dayjs(selectedDate));

  useEffect(() => {
    // Update currentDate to match the selectedDate's week
    setCurrentDate(dayjs(selectedDate).startOf("week"));
  }, [selectedDate]);

  // Get the start of the week
  const startOfWeek = currentDate.startOf("week");
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    startOfWeek.add(i, "day").format("YYYY-MM-DD")
  );

  // Move to the previous week
  const prevWeek = () => setCurrentDate(currentDate.subtract(7, "day"));

  // Move to the next week
  const nextWeek = () => setCurrentDate(currentDate.add(7, "day"));

  return (
    <View className="p-4 bg-[#42779F] rounded-lg" style={shadows.large}>
      {/* Month Header with Arrows */}
      <View className="flex-row justify-between items-center mb-2">
        <TouchableOpacity onPress={prevWeek}>
          <Ionicons name="chevron-back-outline" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">
          {currentDate.format("MMMM")}
        </Text>
        <TouchableOpacity onPress={nextWeek}>
          <Ionicons name="chevron-forward-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Week View */}
      <FlatList
        data={weekDays}
        horizontal
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isSelected = item === selectedDate;
          const isWorkoutDay = workoutDays[item];

          return (
            <TouchableOpacity
              onPress={() => onSelectDate(item)}
              className="mx-2"
            >
              {/* Fixed width container with consistent styling */}
              <View
                className={`w-12 h-16 p-2 rounded-lg justify-center items-center ${
                  isSelected ? "bg-[#5FA3D6]" : "bg-[#42779F]"
                }`}
                style={isSelected ? { borderWidth: 2, borderColor: '#5FA3D6' } : {}}
              >
                <Text className="text-center text-white font-bold text-xs">
                  {dayjs(item).format("dd").toUpperCase()}
                </Text>
                <Text className="text-center text-white text-lg">
                  {dayjs(item).date()}
                </Text>
                {isWorkoutDay && (
                  <View className="w-2 h-2 bg-white rounded-full mt-1" />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default HorizontalCalendar;