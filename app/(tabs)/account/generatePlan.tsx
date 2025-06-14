import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from 'expo-constants';
import { useRouter } from "expo-router";

export default function generatePlan() {
    const router = useRouter();

    // Simulated user data from Firestore
    const dummyUserData = {
        age: "23",
        gender: "Male",
        weight: "69",
        height: "165",
        goal: "Fat loss",
    };

    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [goal, setGoal] = useState("");

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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <TouchableOpacity className="ml-5 mt-3" onPress={() => router.back()}>
                <Ionicons name="chevron-back-outline" size={30} color="white" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Generate Workout Plan</Text>

                <Text style={styles.label}>Age</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} />

                <Text style={styles.label}>Gender</Text>
                <TextInput style={styles.input} value={gender} onChangeText={setGender} />

                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} />

                <Text style={styles.label}>Height (cm)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />

                <Text style={styles.label}>Goal</Text>
                <TextInput style={styles.input} value={goal} onChangeText={setGoal} />

                <TouchableOpacity style={styles.button} onPress={handleGenerate}>
                    <Ionicons name="flash" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Generate Plan</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#84BDEA",
    },
    content: {
        padding: Constants.statusBarHeight,
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
