import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { doc, updateDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "../../../../firebase";
import { useFitnessFormStore } from "~/store/useFitnessFormStore";

const questions = [
  {
    key: "general physical fitness",
    question: "Your general physical fitness is",
    options: [
      { label: "Very Poor", value: 1 },
      { label: "Poor", value: 2 },
      { label: "Average", value: 3 },
      { label: "Good", value: 4 },
      { label: "Excellent", value: 5 },
    ],
  },
  {
    key: "cardio",
    question: "Your cardiorespiratory fitness (capacity to do exercise, for instance running, for a long time) is",
    options: [
      { label: "Very Poor", value: 1 },
      { label: "Poor", value: 2 },
      { label: "Average", value: 3 },
      { label: "Good", value: 4 },
      { label: "Excellent", value: 5 },
    ],
  },
  {
    key: "muscular strength",
    question: "Your muscular strength is",
    options: [
      { label: "Very Poor", value: 1 },
      { label: "Poor", value: 2 },
      { label: "Average", value: 3 },
      { label: "Good", value: 4 },
      { label: "Excellent", value: 5 },
    ],
  },
  {
    key: "agility",
    question: "Your speed / agility is",
    options: [
      { label: "Very Poor", value: 1 },
      { label: "Poor", value: 2 },
      { label: "Average", value: 3 },
      { label: "Good", value: 4 },
      { label: "Excellent", value: 5 },
    ],
  },
  {
    key: "flexibility",
    question: "Your flexibility is",
    options: [
      { label: "Very Poor", value: 1 },
      { label: "Poor", value: 2 },
      { label: "Average", value: 3 },
      { label: "Good", value: 4 },
      { label: "Excellent", value: 5 },
    ],
  },
];

export default function FitnessLevelForm() {
  const router = useRouter();
  const { user } = useUser();
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [result, setResult] = useState<string | null>(null);
  const setForm = useFitnessFormStore((state) => state.setForm);

  const handleSelect = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const calculateResult = async () => {
  if (Object.keys(answers).length !== questions.length) {
    Alert.alert("Incomplete", "Please answer all questions before submit.");
    return;
  }

  const sum = Object.values(answers).reduce((acc, val) => acc + val, 0);
  const avg = sum / questions.length; 

  let level: "Very Poor" | "Poor" | "Average" | "Good" | "Excellent" = "Very Poor";

  if (avg == 5.0) {
    level = "Excellent";
  } else if (avg >= 4.0 && avg < 5.0) {
    level = "Good";
  } else if (avg >= 3.0 && avg < 4.0) {
    level = "Average";
  } else if (avg >= 2.0 && avg < 3.0) {
    level = "Poor";
  } else {
    level = "Very Poor";
  }

  setResult(`Your estimated fitness level is: ${level}`);

  try {
    if (user?.id) {
      const userRef = doc(FIRESTORE_DB, "users", user.id);
      await updateDoc(userRef, { level });

      setForm((prev: any) => ({
        ...prev,
        level,
        index: 3,
      }));

      setTimeout(() => {
        router.back();
      }, 1000);
    }
  } catch (error) {
    console.error("Error updating level:", error);
    Alert.alert("Error", "Failed to save your fitness level.");
  }
};


  return (
    <View style={{ flex: 1, paddingTop: 20, backgroundColor: "#84BDEA" }}>
      <TouchableOpacity
        style={{ marginLeft: 10, marginBottom: 10 }}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back-outline" size={30} color="white" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {questions.map((q) => (
          <View key={q.key} style={{ paddingHorizontal: 15, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              {q.question}
            </Text>
            {q.options.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => handleSelect(q.key, opt.value)}
                style={{
                  padding: 12,
                  backgroundColor:
                    answers[q.key] === opt.value ? "#142939" : "#FDFDFF",
                  borderRadius: 8,
                  marginBottom: 5,
                }}
              >
                <Text
                  style={{
                    color: answers[q.key] === opt.value ? "#FDFDFF" : "#142939",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          onPress={calculateResult}
          style={{
            backgroundColor: "#42779F",
            padding: 15,
            marginHorizontal: 15,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Submit</Text>
        </TouchableOpacity>

        {result && (
          <Text
            style={{
              marginTop: 20,
              fontSize: 18,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {result}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
