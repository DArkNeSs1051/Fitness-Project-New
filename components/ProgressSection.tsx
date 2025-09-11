import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { ContributionGraph } from 'react-native-chart-kit';
import dayjs from 'dayjs';
import { shadows } from '~/utils/shadow';
import { useRoutineStore } from '~/store/useRoutineStore';
import { useUserStore } from '~/store/useUserStore';
import { Ionicons } from "@expo/vector-icons";


const screenWidth = Dimensions.get('window').width;

export const ProgressSection = () => {
  
  const allWorkouts = useRoutineStore((state) => state.workouts);
  const completedDates = useRoutineStore((state) => state.getCompletedDates());
  const completedCount = completedDates.length;

  const fitnessLevel = useUserStore((state) => state.user?.level) || 'Intermediate';
  const equipment = useUserStore((state) => state.user?.equipment) || 'Dumbbells';
  const goal = useUserStore((state) => state.user?.goal) || 'Weight Loss';

  const allDates = Object.keys(allWorkouts);
  const maxDate = allDates.length
    ? dayjs(allDates.reduce((a, b) => (a > b ? a : b)))
    : dayjs();

  const endDate = maxDate.toDate();

  const monthValues = completedDates.map(date => ({
    date,
    count: 1,
  }));

  const handleToolTip: any = {}

  return (
    <View style={[styles.container, shadows.large]}>
      <Text style={styles.title}>Your Progress</Text>
      <Text style={styles.subtitle}>Monthly Workout Consistency</Text>

      <View style={styles.graphWrapper}>
        <ContributionGraph
          values={monthValues}
          endDate={endDate}
          numDays={30}
          width={screenWidth - 35}
          height={280}
          squareSize={20}
          gutterSize={5}
          tooltipDataAttrs={(value) => handleToolTip}
          chartConfig={{
            backgroundColor: '#42779F',
            backgroundGradientFrom: '#42779F',
            backgroundGradientTo: '#42779F',
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: () => '#e8eef3',
          }}
          showMonthLabels={true}
          showOutOfRangeDays={true}
          horizontal={true}
          onDayPress={(day) => {
            if (day.count === 1) {
              alert(`✅ Workout completed on ${day.date}`);
            } else {
              alert(`❌ No workout on ${day.date}`);
            }
          }}
        />

        <View style={styles.overlayText}>
          <Text style={styles.completedText}>{completedCount}</Text>
          <Text style={styles.completedText}>Streak</Text>
        </View>

        <View style={styles.overlayBottom}>
          <Text style={styles.headerinfoText}>Workout</Text>
          <View className='flex-row items-center space-x-3 mb-1'>
            <View className="mr-3 bg-[#42779F] rounded-[10]">
              <Ionicons className="m-2" name="flag" size={20} color="#FFFFFF" />
            </View>
            <View >
              <Text style={styles.infodetailText}>Goal</Text>
              <Text style={styles.infoText}>{goal}</Text>
            </View>
          </View>
          <View className='flex-row items-center space-x-3 mb-1'>
            <View className="mr-3 bg-[#42779F] rounded-[10]">
              <Ionicons className="m-2" name="bar-chart" size={20} color="#FFFFFF" />
            </View>
            <View >
              <Text style={styles.infodetailText}>Level</Text>
              <Text style={styles.infoText}>{fitnessLevel}</Text>
            </View>
          </View>
          <View className='flex-row items-center space-x-3 mb-1'>
            <View className="mr-3 bg-[#42779F] rounded-[10]">
              <Ionicons className="m-2" name="barbell" size={20} color="#FFFFFF" />
            </View>
            <View >
              <Text style={styles.infodetailText}>Equipment</Text>
              <Text style={styles.infoText}>{equipment}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#42779F',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  title: {
    color: '#e8eef3',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  graphWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  overlayText: {
    position: 'absolute',
    top: 10,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 38,
    paddingVertical: 6,
    borderRadius: 10,
  },
  completedText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 25,
    fontWeight: '600',
  },
  overlayBottom: {
    position: 'absolute',
    top: 90,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 10,
    width: 150,
  },
  infoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infodetailText: {
    color: '#47aaf5',
    fontSize: 12,
    marginBottom: 2,
  },
  headerinfoText: {
    color: 'white',
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 4,
  },
});
