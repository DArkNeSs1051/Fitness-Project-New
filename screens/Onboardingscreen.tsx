import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

const OnboardingScreen = () => {
  const [gender, setGender] = useState("female");

  return (
    <View className="flex-1 bg-blue-300 justify-center px-6">
      <Text className="text-xl font-bold text-black">Hello Username!</Text>
      <Text className="text-sm text-gray-700 mb-4">Tell us more about yourself</Text>

      <Text className="text-lg mb-2">Select your gender</Text>
      <View className="flex-row space-x-4 mb-4">
        <TouchableOpacity
          className={`flex-1 p-4 rounded-lg border ${gender === "male" ? "border-gray-400" : "border-black"}`}
          onPress={() => setGender("male")}
        >
          <Text className="text-center">👦 Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 p-4 rounded-lg border ${gender === "female" ? "border-gray-400" : "border-black"}`}
          onPress={() => setGender("female")}
        >
          <Text className="text-center">👩 Female</Text>
        </TouchableOpacity>
      </View>

      <Text className="mb-1">Age</Text>
      <TextInput className="border p-3 rounded-lg bg-white mb-4" keyboardType="numeric" placeholder="Enter your age" />

      <Text className="mb-1">Weight</Text>
      <View className="flex-row items-center mb-4">
        <TextInput className="border p-3 flex-1 rounded-lg bg-white" keyboardType="numeric" placeholder="Enter weight" />
        <TouchableOpacity className="ml-2 px-4 py-2 border rounded-lg">
          <Text>KG</Text>
        </TouchableOpacity>
        <TouchableOpacity className="ml-2 px-4 py-2 border rounded-lg">
          <Text>Lbs</Text>
        </TouchableOpacity>
      </View>

      <Text className="mb-1">Height</Text>
      <View className="flex-row items-center mb-6">
        <TextInput className="border p-3 flex-1 rounded-lg bg-white" keyboardType="numeric" placeholder="Enter height" />
        <TouchableOpacity className="ml-2 px-4 py-2 border rounded-lg">
          <Text>CM</Text>
        </TouchableOpacity>
        <TouchableOpacity className="ml-2 px-4 py-2 border rounded-lg">
          <Text>Ft</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="bg-black py-3 rounded-lg">
        <Text className="text-white text-center font-bold">Continued</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OnboardingScreen;
