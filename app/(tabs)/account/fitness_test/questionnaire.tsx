import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { doc, updateDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "../../../../firebase"; // adjust to your path

const questions = [
  {
    key: 'frequency',
    question: 'How often do you exercise per week?',
    options: [
      { label: '0–1 days', value: 1 },
      { label: '2–3 days', value: 2 },
      { label: '4+ days', value: 3 },
    ],
  },
  {
    key: 'type',
    question: 'What type of exercises do you usually do?',
    options: [
      { label: 'Light (walking, stretching)', value: 1 },
      { label: 'Moderate (bodyweight, yoga)', value: 2 },
      { label: 'Intense (HIIT, strength, sports)', value: 3 },
    ],
  },
  {
    key: 'duration',
    question: 'How long is your typical workout session?',
    options: [
      { label: 'Less than 20 minutes', value: 1 },
      { label: '20–40 minutes', value: 2 },
      { label: 'More than 40 minutes', value: 3 },
    ],
  },
  {
    key: 'pushups',
    question: 'Can you do 10+ push-ups with proper form?',
    options: [
      { label: 'No', value: 1 },
      { label: 'Yes, but it’s difficult', value: 2 },
      { label: 'Yes, easily', value: 3 },
    ],
  },
  {
    key: 'selfRating',
    question: 'How do you rate your overall fitness?',
    options: [
      { label: 'Beginner', value: 1 },
      { label: 'Average/Moderate', value: 2 },
      { label: 'Fit/Strong', value: 3 },
    ],
  },
];

export default function FitnessLevelForm() {
  const router = useRouter();
  const { user } = useUser();
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [result, setResult] = useState<string | null>(null);

  const handleSelect = (key: string, value: number) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const calculateResult = async () => {
  const total = Object.values(answers).reduce((sum, val) => sum + val, 0);
  let level = 'beginner';
  if (total >= 12) level = 'advanced';
  else if (total >= 8) level = 'intermediate';

  setResult(`Your estimated fitness level is: ${level}`);

  try {
    if (user?.id) {
      const userRef = doc(FIRESTORE_DB, "users", user.id);
      await updateDoc(userRef, { level });
      setTimeout(() => {
        router.replace("/workout");
      }, 1000);
    }
  } catch (error) {
    console.error("Error updating level:", error);
    Alert.alert("Error", "Failed to save your fitness level.");
  }
};


  return (
    <View style={{ flex: 1, paddingTop: Constants.statusBarHeight, backgroundColor: '#84BDEA' }}>
      <TouchableOpacity style={{ marginLeft: 10, marginBottom: 10 }} onPress={() => router.back()}>
        <Ionicons name="chevron-back-outline" size={30} color="white" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {questions.map(q => (
          <View key={q.key} style={{ paddingHorizontal: 15, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{q.question}</Text>
            {q.options.map(opt => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => handleSelect(q.key, opt.value)}
                style={{
                  padding: 12,
                  backgroundColor: answers[q.key] === opt.value ? '#142939' : '#FDFDFF',
                  borderRadius: 8,
                  marginBottom: 5,
                }}
              >
                <Text style={{ color: answers[q.key] === opt.value ? '#FDFDFF' : '#142939' }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          onPress={calculateResult}
          style={{
            backgroundColor: '#42779F',
            padding: 15,
            marginHorizontal: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit</Text>
        </TouchableOpacity>

        {result && (
          <Text style={{ marginTop: 20, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
            {result}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
