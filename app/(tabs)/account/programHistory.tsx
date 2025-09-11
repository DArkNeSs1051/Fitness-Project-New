import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from "expo-router";
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '~/utils/shadow';
import { useRoutineStore } from '~/store/useRoutineStore';
import { useUser } from '@clerk/clerk-expo';
import dayjs from 'dayjs';
import { getDownloadURL, ref } from 'firebase/storage';
import { FIREBASE_STORE } from '~/firebase';

const THUMB_FOLDER = 'Exercisemedia/RoutineThumbnail';

const TITLE_TO_FILE: Array<[RegExp, string]> = [
  [/rest/i, 'restday.jpg'],
  [/upper/i, 'upper.jpg'],
  [/lower/i, 'lower.jpg'],
  [/core|abs/i, 'core.jpg'],
  [/circuit|hiit|metcon/i, 'circuit.jpg'],
  [/full|total/i, 'fullbody.jpg'],
];

function pickFileFromTitle(title: string) {
  const t = (title || '').toLowerCase();
  for (const [re, file] of TITLE_TO_FILE) {
    if (re.test(t)) return file;
  }
  return 'fullbody.jpg';
}

const ProgramHistoryIndex: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();

  const {
    fetchRoutineFromFirestore,
    getCompletedDates,
    workouts
  } = useRoutineStore();

  const [loaded, setLoaded] = useState(false);

  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    const uniqueFiles = Array.from(
      new Set([
        'restday.jpg',
        'upper.jpg',
        'lower.jpg',
        'core.jpg',
        'circuit.jpg',
        'fullbody.jpg',
      ])
    );

    (async () => {
      try {
        const entries = await Promise.all(
          uniqueFiles.map(async (file) => {
            try {
              const url = await getDownloadURL(
                ref(FIREBASE_STORE, `${THUMB_FOLDER}/${file}`)
              );
              return [file, url] as const;
            } catch (err) {
              console.warn('⚠️ thumb missing:', file, err);
              return [file, ''] as const;
            }
          })
        );
        if (mounted) setThumbs(Object.fromEntries(entries));
      } catch (e) {
        console.error('Error prefetching thumbs:', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user?.id && !loaded) {
      fetchRoutineFromFirestore(user.id).then(() => setLoaded(true));
    }
  }, [user?.id, loaded, fetchRoutineFromFirestore]);

  const completedDates = getCompletedDates();

  const items = useMemo(() => {
    return completedDates.map((date) => {
      const w = workouts[date];
      const title = w?.title || 'Workout';
      const file = pickFileFromTitle(title);
      const imageUri = thumbs[file] || ''; 
      const muscles =
        (w?.exercises || [])
          .map((e: any) => e?.target)
          .filter(Boolean)
          .join(', ') || 'Full Body';

      return {
        date,
        title,
        day: dayjs(date).format('YYYY-MM-DD'),
        targetMuscles: muscles,
        imageUri,
      };
    });
  }, [completedDates, workouts, thumbs]);

  return (
    <SafeAreaView className="flex-1 bg-[#84BDEA]">
      <StatusBar style="dark" />
      <View className="flex-1 px-4 pb-2 pt-3 mb-1">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={30} color="white" />
        </TouchableOpacity>

        <View className="bg-[#42779F] rounded-[12] mt-5 p-4 flex-1" style={shadows.large}>
          <Text className="text-[#ffff] text-3xl font-bold mb-4">History</Text>

          {items.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="search-outline" size={35} color="white" />
              <Text className="text-white text-center text-base">No completed routines yet.</Text>
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {items.map((it) => (
                <TouchableOpacity
                  key={it.date}
                  onPress={() => router.push(`/workout/${it.date}`)}
                  className="mb-4"
                >
                  <View className="bg-white rounded-xl overflow-hidden shadow-md">
                    <View className="relative">
                      {it.imageUri ? (
                        <Image
                          source={{ uri: it.imageUri }}
                          className="w-full h-40"
                          style={{ width: '100%', height: 150 }}
                        />
                      ) : (
                        <View
                          className="w-full h-40"
                          style={{ width: '100%', height: 150, backgroundColor: 'rgba(0,0,0,0.15)' }}
                        />
                      )}
                      <View className="absolute inset-0 bg-black/30" />
                      <View className="absolute left-4 top-4">
                        <Text className="text-white text-xl font-bold">{it.title}</Text>
                      </View>
                      <View className="absolute left-4 bottom-1">
                        <Text className="text-white text-base">{it.day}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center px-4 py-2 bg-gray-800 rounded-b-xl">
                      <Ionicons name="body" size={16} color="white" />
                      <Text className="text-white ml-2 text-sm">Tap to see more detail.</Text>
                      <Ionicons style={{ position: 'absolute', right: 8 }} name="chevron-forward" size={24} color="white" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProgramHistoryIndex;
