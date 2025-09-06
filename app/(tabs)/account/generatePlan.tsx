import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import * as Progress from "react-native-progress";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { FIRESTORE_DB, FIREBASE_APP } from "../../../firebase";
import { useUser } from "@clerk/clerk-expo";

export default function GeneratePlanScreen() {
  const router = useRouter();
  const { user }: { user: any | null } = useUser();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState("");
  const [equipment, setEquipment] = useState("");

  const [openGoal, setOpenGoal] = useState(false);
  const [openEquipment, setOpenEquipment] = useState(false);
  const [items, setItems] = useState([
    { label: "Lose weight", value: "lose weight" },
    { label: "Gain Muscle", value: "gain muscle" },
    { label: "Maintain Weight", value: "maintain weight" },
  ]);
   const [itemsEquipment, setItemsEquipment] = useState([
    { label: "None", value: "None" },
    { label: "Dumbbell", value: "Dumbbell" },
  ]);

  const getProgressText = () => {
    if (progress < 30) return "Saving your information...";
    if (progress < 70) return "Hang tight! We’re generating the best plan just for you...";
    if (progress < 100) return "Finalizing...";
    return "Done!";
  };


  useEffect(() => {
    if (!user?.id) return;

    const fetchUserData = async () => {
      try {
        const docRef = doc(FIRESTORE_DB, "users", user.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAge(data.age?.toString() || "");
          setGender(data.gender || "");
          setWeight(data.weight?.toString() || "");
          setHeight(data.height?.toString() || "");
          setGoal(data.goal || "");
          setEquipment(data.equipment || "");
        }
      } catch (err) {
        console.error("Error loading user data", err);
        Alert.alert("Error", "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  const isValidNumber = (value: string) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  };

  const handleGenerate = async () => {
    if (!age || !gender || !weight || !height || !goal || !equipment) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    if (!isValidNumber(age) || !isValidNumber(weight) || !isValidNumber(height)) {
      Alert.alert("Invalid Input", "Age, weight, and height must be positive numbers.");
      return;
    }

    setSubmitting(true);
    setProgress(10);

    try {
      await new Promise((r) => setTimeout(r, 300)); 
      setProgress(30);

      const userRef = doc(FIRESTORE_DB, "users", user.id);
      await updateDoc(userRef, { age, gender, weight, height, goal, equipment });

      setProgress(60);
      await new Promise((r) => setTimeout(r, 300));

      const generatePlan = httpsCallable(getFunctions(FIREBASE_APP), "generateWorkoutPlan");
      await generatePlan({ userId: user.id });

      setProgress(90);
      await new Promise((r) => setTimeout(r, 300));

      setProgress(100);
      await new Promise((r) => setTimeout(r, 500));

      Alert.alert("Success", "Workout plan generated!");
      router.push("/workout");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to generate plan");
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={{ marginLeft: 20, marginTop: 20 }} onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={30} color="white" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Generate Workout Plan</Text>

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <Text style={styles.label}>Gender</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
            {["Male", "Female"].map((g) => (
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender.toLowerCase() === g.toLowerCase() && styles.genderSelected,
                ]}
                key={g}
                onPress={() => setGender(g.toLowerCase())}
              >
                <Text
                  style={{
                    color: gender.toLowerCase() === g.toLowerCase() ? "#fff" : "#333",
                    textAlign: "center",
                  }}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />

          <Text style={styles.label}>Equipment</Text>
          <View style={{zIndex: openEquipment ? 2000 : 1000}}>
            <DropDownPicker
              open={openEquipment}
              value={equipment}
              items={itemsEquipment}
              setOpen={setOpenEquipment}
              setValue={setEquipment}
              setItems={setItems}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              placeholder="Select your equipment"
              disabled={submitting}
            />
          </View>

          <Text style={styles.label}>Goal</Text>
          <View style={{zIndex: openGoal ? 2000 : 1000}}>
            <DropDownPicker
              open={openGoal}
              value={goal}
              items={items}
              setOpen={setOpenGoal}
              setValue={setGoal}
              setItems={setItems}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              placeholder="Select your goal"
              disabled={submitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && { opacity: 0.6 }]}
            onPress={handleGenerate}
            disabled={submitting}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.buttonText}>Generate Plan</Text>
          </TouchableOpacity>
        </View>

        {submitting && (
          <View style={styles.overlay}>
            <Progress.Circle
              size={200}
              progress={progress / 100}
              showsText={true}
              color="#fff"
              thickness={8}
              borderWidth={2}
              unfilledColor="rgba(255,255,255,0.3)"
              textStyle={{ color: "#fff", fontWeight: "bold" }}
            />
            <Text className="animate-pulse text-center" style={styles.overlayText}>{getProgressText()}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#84BDEA",
  },
  content: {
    padding: 40
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    marginTop: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 5,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    marginTop: 5,
    
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#3D80C5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#84BDEA",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  overlayText: {
    marginTop: 12,
    marginHorizontal: 20,
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  genderButton: {
    flex: 1,
    backgroundColor: "#e2e2e2",
    paddingVertical: 10,
    borderRadius: 50,
  },
  genderSelected: {
    backgroundColor: "#3D80C5",
  },
});
