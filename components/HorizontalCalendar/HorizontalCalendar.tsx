import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { shadows } from "~/utils/shadow";

type WorkoutDayMark = {
  marked: boolean;
  dotColor: string;
};
type WorkoutDaysMap = Record<string, WorkoutDayMark>;

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  workoutDays: WorkoutDaysMap;
}

const HorizontalCalendar: React.FC<Props> = ({ selectedDate, onSelectDate, workoutDays }) => {
  const [currentDate, setCurrentDate] = useState(dayjs(selectedDate));

  useEffect(() => {
    setCurrentDate(dayjs(selectedDate).startOf("week"));
  }, [selectedDate]);

  const startOfWeek = currentDate.startOf("week");
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    startOfWeek.add(i, "day").format("YYYY-MM-DD")
  );

  const prevWeek = () => setCurrentDate((d) => d.subtract(7, "day"));
  const nextWeek = () => setCurrentDate((d) => d.add(7, "day"));

  return (
    <View className="p-4 bg-[#42779F] rounded-lg" style={shadows.large}>
      {/* Month Header */}
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
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item === selectedDate;
          const mark = workoutDays[item]; 
          const hasWorkout = !!mark?.marked;

          return (
            <TouchableOpacity onPress={() => onSelectDate(item)} className="mx-2">
              <View
                className={`w-12 h-16 p-2 rounded-lg justify-center items-center ${
                  isSelected ? "bg-[#5FA3D6]" : "bg-[#42779F]"
                }`}
                
              >
                <Text className="text-center text-white font-bold text-xs">
                  {dayjs(item).format("dd").toUpperCase()}
                </Text>
                <Text className="text-center text-white text-lg">
                  {dayjs(item).date()}
                </Text>
                {hasWorkout && (
                  <View
                    className="w-2 h-2 rounded-full mt-1"
                    style={{ backgroundColor: "#FFFFFF" }}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default HorizontalCalendar;
