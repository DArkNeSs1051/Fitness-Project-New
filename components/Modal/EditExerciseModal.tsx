import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

export type EditExercise = {
  id: string;
  exercise: string;
  target: string; // keep string since you don’t edit it here
  reps: number | string; 
  sets: number;
  rest: string; 
};

export type EditExerciseModalRef = {
  present: (exercise: EditExercise) => void;
  dismiss: () => void;
};

interface Props {
  onSave: (updated: EditExercise) => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const isTimeBasedExercise = (exerciseName: string): boolean => {
  const timeBasedExercises = ['plank', 'wall sit', 'hold', 'static'];
  return timeBasedExercises.some(keyword => 
    exerciseName.toLowerCase().includes(keyword)
  );
};

const parseTimeToSeconds = (timeStr: string): { minutes: number; seconds: number } => {
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return { minutes: 0, seconds: 0 };
  }
  const [minStr, secStr] = timeStr.split(':');
  const minutes = Math.max(0, Math.min(parseInt(minStr) || 0, 10));
  const seconds = Math.max(0, Math.min(parseInt(secStr) || 0, 59));
  return { minutes, seconds };
};

const formatTime = (minutes: number, seconds: number): string => {
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const EditExerciseModal = forwardRef<EditExerciseModalRef, Props>(
  ({ onSave }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const repsListRef = useRef<FlatList>(null);
    const setsListRef = useRef<FlatList>(null);
    const minutesListRef = useRef<FlatList>(null);
    const secondsListRef = useRef<FlatList>(null);
    const timeMinutesListRef = useRef<FlatList>(null);
    const timeSecondsListRef = useRef<FlatList>(null);
    
    const [exercise, setExercise] = useState<EditExercise | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isTimeBased, setIsTimeBased] = useState(false);

    const repsArray = useMemo(() => Array.from({ length: 31 }, (_, i) => i+1), []);
    const setsArray = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
    const minutesArray = useMemo(() => Array.from({ length: 11 }, (_, i) => i), []);
    const secondsArray = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);
    
    const timeMinutesArray = useMemo(() => Array.from({ length: 11 }, (_, i) => i), []);
    const timeSecondsArray = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

    const [selectedReps, setSelectedReps] = useState(1);
    const [selectedSets, setSelectedSets] = useState(1);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedSecond, setSelectedSecond] = useState(0);
    
    const [selectedTimeMinute, setSelectedTimeMinute] = useState(0);
    const [selectedTimeSecond, setSelectedTimeSecond] = useState(30);

    const snapPoints = useMemo(() => ['65%'], []);

    useEffect(() => {
      if (isModalVisible && exercise) {
        const timer = setTimeout(() => {
          if (isTimeBased) {
            const timeMinutesOffset = selectedTimeMinute * ITEM_HEIGHT;
            const timeSecondsOffset = selectedTimeSecond * ITEM_HEIGHT;
            timeMinutesListRef.current?.scrollToOffset({ offset: timeMinutesOffset, animated: false });
            timeSecondsListRef.current?.scrollToOffset({ offset: timeSecondsOffset, animated: false });
          } else {
            const repsOffset = (selectedReps - 1) * ITEM_HEIGHT;
            repsListRef.current?.scrollToOffset({ offset: repsOffset, animated: false });
          }
          
          const setsOffset = (selectedSets - 1) * ITEM_HEIGHT;
          const minutesOffset = selectedMinute * ITEM_HEIGHT;
          const secondsIndex = secondsArray.indexOf(selectedSecond);
          const secondsOffset = secondsIndex >= 0 ? secondsIndex * ITEM_HEIGHT : 0;

          setsListRef.current?.scrollToOffset({ offset: setsOffset, animated: false });
          minutesListRef.current?.scrollToOffset({ offset: minutesOffset, animated: false });
          secondsListRef.current?.scrollToOffset({ offset: secondsOffset, animated: false });
        }, Platform.OS === 'android' ? 600 : 300);
        
        return () => clearTimeout(timer);
      }
    }, [isModalVisible, exercise, selectedReps, selectedSets, selectedMinute, selectedSecond, selectedTimeMinute, selectedTimeSecond, secondsArray, isTimeBased]);

    useImperativeHandle(ref, () => ({
      present: (ex) => {
        const [minStr, secStr] = (ex.rest || '0:00').split(':');
        const min = Math.min(parseInt(minStr) || 0, 10);
        const sec = parseInt(secStr) || 0;
        const validSecond = secondsArray.includes(sec) ? sec : 0;

        const timeBasedExercise = isTimeBasedExercise(ex.exercise);
        setIsTimeBased(timeBasedExercise);

        setExercise(ex);
        setSelectedSets(Math.min(Math.max(ex.sets, 1), 10));
        setSelectedMinute(min);
        setSelectedSecond(validSecond);
        
        if (timeBasedExercise) {
          const { minutes, seconds } = parseTimeToSeconds(String(ex.reps));
          setSelectedTimeMinute(minutes);
          setSelectedTimeSecond(seconds);
        } else {
          const repsValue = typeof ex.reps === 'number' ? ex.reps : parseInt(String(ex.reps)) || 1;
          setSelectedReps(Math.min(Math.max(repsValue, 1), 30));
        }
        
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => {
        bottomSheetModalRef.current?.dismiss();
      },
    }));

    const handleSave = () => {
      if (exercise) {
        const formattedRest = `${String(selectedMinute).padStart(2, '0')}:${String(selectedSecond).padStart(2, '0')}`;

        const repsValue = isTimeBased 
          ? formatTime(selectedTimeMinute, selectedTimeSecond)
          : selectedReps;

        const updated: EditExercise = {
          ...exercise,
          reps: repsValue,
          sets: selectedSets,
          rest: formattedRest,
        };

        onSave(updated);
        bottomSheetModalRef.current?.dismiss();
      }
    };

    const handleModalChange = useCallback((index: number) => {
      setIsModalVisible(index >= 0);
      if (index < 0) {
        setExercise(null);
      }
    }, []);

    const handleRepsScroll = useCallback((event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), repsArray.length - 1);
      setSelectedReps(repsArray[clampedIndex]);
    }, [repsArray]);

    const handleSetsScroll = useCallback((event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), setsArray.length - 1);
      const newValue = setsArray[clampedIndex];
      if (newValue !== selectedSets) {
        setSelectedSets(newValue);
      }
    }, [setsArray, selectedSets]);

    const handleMinutesScroll = useCallback((event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), minutesArray.length - 1);
      setSelectedMinute(minutesArray[clampedIndex]);
    }, [minutesArray]);

    const handleSecondsScroll = useCallback((event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), secondsArray.length - 1);
      setSelectedSecond(secondsArray[clampedIndex]);
    }, [secondsArray]);

    const handleTimeMinutesScroll = useCallback((event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), timeMinutesArray.length - 1);
      setSelectedTimeMinute(timeMinutesArray[clampedIndex]);
    }, [timeMinutesArray]);

    const handleTimeSecondsScroll = useCallback((event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), timeSecondsArray.length - 1);
      setSelectedTimeSecond(timeSecondsArray[clampedIndex]);
    }, [timeSecondsArray]);

    const renderPickerItem = useCallback(({ item, index, isSelected }: { item: number, index: number, isSelected: boolean }) => (
      <View style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}>
        <Text style={[styles.pickerText, isSelected && styles.selectedText]}>
          {String(item).padStart(2, '0')}
        </Text>
      </View>
    ), []);

    const getItemLayout = useCallback((data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }), []);

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        enablePanDownToClose
        onChange={handleModalChange}
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={styles.container}>
          <Text style={styles.title}>Edit Exercise</Text>

          <View style={styles.containerRepSet}>
            <View style={styles.flexRepSet}>
              <Text style={styles.label}>{isTimeBased ? 'Duration (MM:SS)' : 'Reps'}</Text>
              {isTimeBased ? (
                <View style={styles.timePickerContainer}>
                  <View style={styles.pickerWrapper}>
                    <View style={styles.selectionIndicator} />
                    <FlatList
                      ref={timeMinutesListRef}
                      data={timeMinutesArray}
                      keyExtractor={(item, index) => `time-minutes-${item}-${index}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      snapToAlignment="center"
                      decelerationRate="fast"
                      bounces={false}
                      nestedScrollEnabled={true}
                      contentContainerStyle={styles.pickerList}
                      scrollEventThrottle={16}
                      getItemLayout={getItemLayout}
                      onScroll={handleTimeMinutesScroll}
                      initialScrollIndex={selectedTimeMinute}
                      onScrollToIndexFailed={() => {}}
                      renderItem={({ item, index }) => 
                        renderPickerItem({ item, index, isSelected: item === selectedTimeMinute })
                      }
                    />
                  </View>
                  
                  <Text style={styles.timeColon}>:</Text>
                  
                  <View style={styles.pickerWrapper}>
                    <View style={styles.selectionIndicator} />
                    <FlatList
                      ref={timeSecondsListRef}
                      data={timeSecondsArray}
                      keyExtractor={(item, index) => `time-seconds-${item}-${index}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      snapToAlignment="center"
                      decelerationRate="fast"
                      bounces={false}
                      nestedScrollEnabled={true}
                      contentContainerStyle={styles.pickerList}
                      scrollEventThrottle={16}
                      getItemLayout={getItemLayout}
                      onScroll={handleTimeSecondsScroll}
                      initialScrollIndex={selectedTimeSecond}
                      onScrollToIndexFailed={() => {}}
                      renderItem={({ item, index }) => 
                        renderPickerItem({ item, index, isSelected: item === selectedTimeSecond })
                      }
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.pickerWrapper}>
                  <View style={styles.selectionIndicator} />
                  <FlatList
                    ref={repsListRef}
                    data={repsArray}
                    keyExtractor={(item, index) => `reps-${item}-${index}`}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    snapToAlignment="center"
                    decelerationRate="fast"
                    bounces={false}
                    nestedScrollEnabled={true}
                    contentContainerStyle={styles.pickerList}
                    scrollEventThrottle={16}
                    getItemLayout={getItemLayout}
                    onScroll={handleRepsScroll}
                    initialScrollIndex={selectedReps - 1}
                    onScrollToIndexFailed={() => {}}
                    renderItem={({ item, index }) => 
                      renderPickerItem({ item, index, isSelected: item === selectedReps })
                    }
                  />
                </View>
              )}
            </View>

            <View style={styles.flexRepSet}>
              <Text style={styles.label}>Sets</Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.selectionIndicator} />
                <FlatList
                  ref={setsListRef}
                  data={setsArray}
                  keyExtractor={(item, index) => `sets-${item}-${index}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  bounces={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.pickerList}
                  scrollEventThrottle={16}
                  getItemLayout={getItemLayout}
                  onScroll={handleSetsScroll}
                  initialScrollIndex={selectedSets - 1}
                  onScrollToIndexFailed={() => {}}
                  renderItem={({ item, index }) => 
                    renderPickerItem({ item, index, isSelected: item === selectedSets })
                  }
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Rest Time (MM:SS)</Text>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
              <View style={styles.selectionIndicator} />
              <FlatList
                ref={minutesListRef}
                data={minutesArray}
                keyExtractor={(item, index) => `minutes-${item}-${index}`}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="center"
                decelerationRate="fast"
                bounces={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.pickerList}
                scrollEventThrottle={16}
                getItemLayout={getItemLayout}
                onScroll={handleMinutesScroll}
                initialScrollIndex={selectedMinute}
                onScrollToIndexFailed={() => {}}
                renderItem={({ item, index }) => 
                  renderPickerItem({ item, index, isSelected: item === selectedMinute })
                }
              />
            </View>
            
            <Text style={styles.colon}>:</Text>
            
            <View style={styles.pickerWrapper}>
              <View style={styles.selectionIndicator} />
              <FlatList
                ref={secondsListRef}
                data={secondsArray}
                keyExtractor={(item, index) => `seconds-${item}-${index}`}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="center"
                decelerationRate="fast"
                bounces={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.pickerList}
                scrollEventThrottle={16}
                getItemLayout={getItemLayout}
                onScroll={handleSecondsScroll}
                initialScrollIndex={secondsArray.indexOf(selectedSecond)}
                onScrollToIndexFailed={() => {}}
                renderItem={({ item, index }) => 
                  renderPickerItem({ item, index, isSelected: item === selectedSecond })
                }
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  containerRepSet: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 30, marginBottom: 20 },
  flexRepSet: { flexDirection: 'column', marginTop: 10, padding: 5, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#000', textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', marginVertical: 8, color: '#000', textAlign: 'center' },
  pickerWrapper: { height: PICKER_HEIGHT, width: 80, position: 'relative', borderRadius: 8, overflow: 'hidden' },
  timePickerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  timeColon: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 8, color: '#5FA3D6', alignSelf: 'center', marginTop: 20 },
  selectionIndicator: { position: 'absolute', top: ITEM_HEIGHT, left: 0, right: 0, height: ITEM_HEIGHT, backgroundColor: 'rgba(95, 163, 214, 0.2)', borderRadius: 8, zIndex: 1, pointerEvents: 'none' },
  pickerList: { paddingVertical: ITEM_HEIGHT },
  pickerItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  selectedPickerItem: {},
  pickerText: { fontSize: 18, color: '#666', fontWeight: '500' },
  selectedText: { color: '#5FA3D6', fontWeight: 'bold', fontSize: 20 },
  pickerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, marginHorizontal: 50 },
  colon: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 16, color: '#5FA3D6' },
  saveButton: { backgroundColor: '#5FA3D6', paddingVertical: 14, borderRadius: 12, marginTop: 20, marginHorizontal: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  saveButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
});

export default EditExerciseModal;
