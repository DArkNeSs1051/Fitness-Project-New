import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { shadows } from '~/utils/shadow';

interface Workout {
  day: string;         // e.g. 'Mon', 'Tue'
  completed: boolean;  // true or false
}

interface Props {
  workoutsThisWeek: Workout[];
}

const screenWidth = Dimensions.get('window').width;

export const ProgressSection = ({ workoutsThisWeek }: Props) => {
  const chartLabels = workoutsThisWeek.map(w => w.day);
  const chartData = workoutsThisWeek.map(w => (w.completed ? 1 : 0));

  return (
    <View className="bg-[#42779F] rounded-2xl p-4 mx-4 mb-4" style={shadows.large}>
      <Text className="text-[#e8eef3] text-2xl font-bold mb-4">Your Progress</Text>

      {/* Bar Chart */}
      <Text className="text-base font-semibold mb-2 text-white">Weekly Workout Completion</Text>
      <BarChart
        data={{
          labels: chartLabels,
          datasets: [{ data: chartData }],
        }}
        width={screenWidth - 64} // padding-aware
        height={220}
        fromZero
        chartConfig={{
          backgroundColor: '#42779F',
          backgroundGradientFrom: '#42779F',
          backgroundGradientTo: '#42779F',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(66, 163, 237, ${opacity})`,
          labelColor: () => '#e8eef3',
          propsForBackgroundLines: {
            stroke: '#5fa3d6',
            strokeDasharray: '',
          },
        }}
        style={{
          borderRadius: 12,
        }}
        showValuesOnTopOfBars
        withInnerLines={false}
      />
    </View>
  );
};
