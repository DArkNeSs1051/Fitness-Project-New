import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, Dimensions, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ContributionGraph } from 'react-native-chart-kit';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { shadows } from '~/utils/shadow';
import { useRoutineStore } from '~/store/useRoutineStore';
import { useUserStore } from '~/store/useUserStore';


const screenWidth = Dimensions.get('window').width;

export const ProgressSection: React.FC = () => {
  const workouts = useRoutineStore((s) => s.workouts);
  const loading = useRoutineStore((s) => s.loading);
  const getCompletedDates = useRoutineStore((s) => s.getCompletedDates);
  const fetchRoutineFromFirestore = useRoutineStore((s) => s.fetchRoutineFromFirestore);
  const userId = useUserStore((s) => s.user?.id) || null;
  const fitnessLevel = useUserStore((s) => s.user?.level) || 'Intermediate';
  const equipment = useUserStore((s) => s.user?.equipment) || 'Dumbbells';
  const goal = useUserStore((s) => s.user?.goal) || 'Weight Loss';

  useEffect(() => {
    if (userId) {
      fetchRoutineFromFirestore(userId);
    }
  }, [userId, fetchRoutineFromFirestore]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchRoutineFromFirestore(userId);
      }
    }, [userId, fetchRoutineFromFirestore])
  );

  const allDates = useMemo(() => Object.keys(workouts ?? {}), [workouts]);

  const endDate = useMemo(() => {
    if (!allDates.length) return dayjs().toDate();
    const max = allDates.reduce((a, b) => (a > b ? a : b));
    return dayjs(max).toDate();
  }, [allDates]);

  const completedDates = useMemo(() => getCompletedDates(), [getCompletedDates, workouts]);
  const completedCount = completedDates.length;

  const monthValues = useMemo(
    () => completedDates.map((d) => ({ date: d, count: 1 })),
    [completedDates]
  );

  const handleDayPress = useCallback((day: { date: string; count?: number }) => {
    if (day?.count === 1) {
      Alert.alert('Workout', `✅ Workout completed on ${day.date}`);
    } else {
      Alert.alert('Workout', `❌ No workout on ${day.date}`);
    }
  }, []);

  const isReady = !loading;

  return (
    <View style={[styles.container, shadows.large]}>
      <Text style={styles.title}>Monthly Workout Consistency</Text>

      {!isReady ? (
        <View style={[styles.graphWrapper, { minHeight: 280, justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: '#e8eef3', marginTop: 8 }}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.graphWrapper}>
          <ContributionGraph
            values={monthValues}
            endDate={endDate}
            numDays={30}
            width={screenWidth - 35}
            height={280}
            squareSize={20}
            gutterSize={5}
            tooltipDataAttrs={() => ({})}
            chartConfig={{
              backgroundColor: '#42779F',
              backgroundGradientFrom: '#42779F',
              backgroundGradientTo: '#42779F',
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: () => '#e8eef3',
            }}
            showMonthLabels
            showOutOfRangeDays
            horizontal
            onDayPress={handleDayPress}
          />

          {/* Streak badge */}
          <View style={styles.overlayText}>
            <Text style={styles.completedText}>{isReady ? completedCount : '–'}</Text>
            <Text style={styles.completedText}>Streak</Text>
          </View>

          {/* info panel */}
          <View style={styles.overlayBottom}>
            <Text style={styles.headerinfoText}>Workout</Text>

            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Ionicons name="flag" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.infodetailText}>Goal</Text>
                <Text style={styles.infoText}>{goal}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Ionicons name="bar-chart" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.infodetailText}>Level</Text>
                <Text style={styles.infoText}>{fitnessLevel}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Ionicons name="barbell" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.infodetailText}>Equipment</Text>
                <Text style={styles.infoText}>{equipment}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#42779F',
    borderRadius: 12,
    padding: 16,
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
  headerinfoText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 4,
  },
  infodetailText: {
    color: '#47aaf5',
    fontSize: 12,
    marginBottom: 2,
  },
  infoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  iconBox: {
    marginRight: 6,
    backgroundColor: '#42779F',
    borderRadius: 10,
    padding: 6,
  },
});
