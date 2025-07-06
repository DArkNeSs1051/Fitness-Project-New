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
    Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";

export default function generatePlan() {
    const router = useRouter();

    // Simulated user data from Firestore
    const dummyUserData = {
        age: "23",
        gender: "Male",
        weight: "69",
        height: "165",
        goal: "Weight loss",
    };

    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");

    const [goal, setGoal] = useState("");
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([
        { label: "Weight loss", value: "weight_loss" },
        { label: "Muscle gain", value: "muscle_gain" },
        { label: "Maintenance", value: "maintenance" },
    ]);

    useEffect(() => {
        // Simulate loading data from Firestore
        setAge(dummyUserData.age);
        setGender(dummyUserData.gender);
        setWeight(dummyUserData.weight);
        setHeight(dummyUserData.height);
        setGoal(dummyUserData.goal);
    }, []);

    const handleGenerate = () => {
        if (!age || !gender || !weight || !height || !goal) {
            Alert.alert("Missing Information", "Please fill in all fields.");
            return;
        }

        // Call Firestore + OpenAI logic here
        // Alert.alert("Workout Plan", "Workout plan generated!");
        // router.push("/Workout");
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <TouchableOpacity className="ml-5 mt-3" onPress={() => router.back()}>
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
                    <View className="flex-row space-x-3 mt-1 mb-1">
                        {['Male', 'Female'].map((g) => (
                            <TouchableOpacity className='flex-1 mr-5 ' key={g} onPress={() => setGender(g as any)}>
                                <Text className={`px-4 py-3 text-center rounded-full ${gender === g ? 'bg-[#3D80C5] text-white' : 'bg-gray-200'}`}>
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

                    <Text style={styles.label}>Goal</Text>
                    <View style={{ zIndex: 1000 }}>
                        <DropDownPicker
                            open={open}
                            value={goal}
                            items={items}
                            setOpen={setOpen}
                            setValue={setGoal}
                            setItems={setItems}
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            placeholder="Select your goal"
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleGenerate}>
                        <Ionicons name="flash" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Generate Plan</Text>
                    </TouchableOpacity>
                </View>
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
        padding: Constants.statusBarHeight,
        paddingBottom: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 20,
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
});
