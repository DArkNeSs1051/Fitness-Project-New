import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { shadows } from "~/utils/shadow";
import { formInterface } from "~/app/auth/question";
import { useFitnessFormStore } from "~/store/useFitnessFormStore";

interface IProps {
  onHideArrow?: boolean;
  form: formInterface;
}

export default function FitnessTestScreen(props: IProps) {
  const { onHideArrow, form } = props;
  const setForm = useFitnessFormStore((state) => state.setForm);
  const router = useRouter();

  const handlePhysicalTestPress = () => {
    Alert.alert(
      "⚠️ Safety Warning",
      "This physical fitness test is recommended for users aged 18–35. If you experience pain, dizziness, difficulty breathing, or discomfort at any time, please stop immediately and do not continue. Users with medical conditions or health concerns should consult a healthcare professional before participating.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "I Understand",
          style: "destructive",
          onPress: () => {
            setForm(form);
            router.push("/account/fitness_test/physicalTest");
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#84BDEA" }}>
      {!onHideArrow && (
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={30} color="white" />
        </TouchableOpacity>
      )}

      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 10,
          marginTop: 10,
          color: "white",
        }}
      >
        Choose Your Fitness Test Method
      </Text>

      <Text
        style={{
          fontSize: 14,
          textAlign: "center",
          color: "white",
          opacity: 0.9,
          marginBottom: 24,
        }}
      >
        Select how you want to assess your current fitness level.
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity
          onPress={() => router.push("/account/fitness_test/questionnaire")}
          style={{
            flex: 1,
            backgroundColor: "#2c5575",
            padding: 24,
            borderRadius: 12,
            marginRight: 10,
            justifyContent: "center",
            alignItems: "center",
            ...shadows.large,
          }}
        >
          <Ionicons
            name="document-text-outline"
            size={80}
            color="#FFFFFF"
            style={{ marginBottom: 12 }}
          />
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Questionnaire
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 12,
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            A simple self-evaluation based on your perception of fitness.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePhysicalTestPress}
          style={{
            flex: 1,
            backgroundColor: "#2c5575",
            padding: 24,
            borderRadius: 12,
            marginLeft: 10,
            justifyContent: "center",
            alignItems: "center",
            ...shadows.large,
          }}
        >
          <Ionicons
            name="barbell-outline"
            size={80}
            color="#FFFFFF"
            style={{ marginBottom: 12 }}
          />
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Physical Test
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 12,
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            Perform real exercises to measure muscular strength,
            endurance, and cardio.
          </Text>
        </TouchableOpacity>
      </View>

      <View 
      style={{
        padding:5,
        marginTop:10,
        borderRadius:12,
        backgroundColor:"#ffa60d87",
      }}
      >
        <Text
          style={{
            color: "#000000",
            margin:10,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          ⚠️ Physical test is recommended for individuals aged 18–35.
          Please stop if you feel pain or discomfort. If you are unsure
          about your health condition, consult a doctor before proceeding.
        </Text>
      </View>
      
    </View>
  );
}
