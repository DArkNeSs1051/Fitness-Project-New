import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { shadows } from "~/utils/shadow";

type ProfileData = {
  name: string;
  birthdate: Date;
  age: string;
  gender: string;
  email: string;
  username: string;
  password: string;
};

const router = useRouter();
const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

const calculateAge = (birthDate: Date): string => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age.toString();
};

const createInitialProfile = (): ProfileData => {
  const birthdate = new Date(1999, 0, 15);
  return {
    name: "Elena",
    birthdate: birthdate,
    age: calculateAge(birthdate),
    gender: "Female",
    email: "Elena@gmail.com",
    username: "Elena1234",
    password: "••••••",
  };
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState(() => createInitialProfile());
  const [editedProfile, setEditedProfile] = useState(() =>
    createInitialProfile()
  );
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const changed = Object.keys(profile).some((key) => {
      if (key === "birthdate") {
        return profile[key].getTime() !== editedProfile[key].getTime();
      }
      return (
        profile[key as keyof ProfileData] !==
        editedProfile[key as keyof ProfileData]
      );
    });
    setHasChanges(changed);
  }, [editedProfile, profile]);

  // Update age when birthdate changes, but only in edit mode
  useEffect(() => {
    if (isEditing) {
      const newAge = calculateAge(editedProfile.birthdate);
      if (newAge !== editedProfile.age) {
        setEditedProfile((prev) => ({ ...prev, age: newAge }));
      }
    }
  }, [editedProfile.birthdate, isEditing]);

  const handleChange = (key: keyof ProfileData, value: string | Date) => {
    setEditedProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleConfirm = () => {
    // Update age one final time before saving
    const finalProfile = {
      ...editedProfile,
      age: calculateAge(editedProfile.birthdate),
    };
    setProfile(finalProfile);
    setEditedProfile(finalProfile);
    setIsEditing(false);
    setHasChanges(false);
  };

  // Modified edit toggle function to handle reverting changes
  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProfile({ ...profile });
      setHasChanges(false);
    }
    setIsEditing((prev) => !prev);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      handleChange("birthdate", selectedDate);
    }
  };

  const handleDatePickerPress = () => {
    if (isEditing) {
      setShowDatePicker(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          className="bg-[#42779F] rounded-[12] flex-1"
          style={shadows.large}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={30} color="white" />
            </TouchableOpacity>
            <View className="flex-column items-center ">
              <View className="bg-[#356182] rounded-[10] ml-10">
                <Ionicons
                  className="m-2"
                  name="person-outline"
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.title}>About you</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: isEditing ? "#98c9ee" : "#142939" },
              ]}
              onPress={handleEditToggle}
            >
              <Ionicons
                name="create"
                size={20}
                color={isEditing ? "#42779F" : "#73b5e8"}
              />
              <Text
                className="font-bold"
                style={{
                  color: isEditing ? "#42779F" : "#73b5e8",
                  marginLeft: 5,
                }}
              >
                {isEditing ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="px-4 py-1">
            <View style={styles.informationWrapper}>
              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  editable={isEditing}
                  value={editedProfile.name}
                  onChangeText={(text) => handleChange("name", text)}
                  returnKeyType="next"
                />
              </View>

              {/* Birthdate Picker */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Birthdate</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerInput]}
                  onPress={handleDatePickerPress}
                  disabled={!isEditing}
                >
                  <Text
                    style={[
                      styles.inputText,
                      !isEditing && styles.disabledText,
                    ]}
                  >
                    {formatDate(editedProfile.birthdate)}
                  </Text>
                  {isEditing && (
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#98c9ee"
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Age Display (Auto-calculated) */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Age</Text>
                <View style={[styles.input, styles.pickerInput]}>
                  <Text style={[styles.inputText, styles.disabledText]}>
                    {editedProfile.age} years old
                  </Text>
                </View>
              </View>

              {/* Gender Dropdown */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Gender</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerInput]}
                  onPress={() => isEditing && setShowGenderPicker(true)}
                  disabled={!isEditing}
                >
                  <Text
                    style={[
                      styles.inputText,
                      !isEditing && styles.disabledText,
                    ]}
                  >
                    {editedProfile.gender}
                  </Text>
                  {isEditing && (
                    <Ionicons
                      name="chevron-down-outline"
                      size={20}
                      color="#98c9ee"
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  editable={isEditing}
                  value={editedProfile.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onChangeText={(text) => handleChange("email", text)}
                />
              </View>

              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  editable={isEditing}
                  value={editedProfile.username}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onChangeText={(text) => handleChange("username", text)}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  editable={isEditing}
                  value={editedProfile.password}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onChangeText={(text) => handleChange("password", text)}
                />
              </View>
            </View>
          </View>

          {/* Buttons */}
          {isEditing && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={{ color: "#333" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: hasChanges ? "#49a0e1" : "#a9a9a9" },
                ]}
                disabled={!hasChanges}
                onPress={handleConfirm}
              >
                <Text style={{ color: "white" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.genderOption,
                  editedProfile.gender === option && styles.selectedOption,
                ]}
                onPress={() => {
                  handleChange("gender", option);
                  setShowGenderPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    editedProfile.gender === option &&
                      styles.selectedOptionText,
                  ]}
                >
                  {option}
                </Text>
                {editedProfile.gender === option && (
                  <Ionicons name="checkmark" size={20} color="#42779F" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={editedProfile.birthdate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          themeVariant="light"
        />
      )}

      {/* iOS DatePicker Modal Wrapper */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Birthdate</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.modalButtonText, styles.doneButton]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={editedProfile.birthdate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                themeVariant="light"
                style={styles.dateTimePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#84BDEA",
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 10,
    borderBottomColor: "#84BDEA",
    borderBottomWidth: 2,
  },
  title: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 30,
    marginTop: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    width: 70,
    justifyContent: "center",
    marginRight: 10,
  },
  informationWrapper: {
    backgroundColor: "#2c4963",
    borderRadius: 12,
    padding: 15,
  },
  inputWrapper: {
    marginBottom: 15,
    backgroundColor: "#2c4963",
    borderRadius: 10,
    padding: 5,
  },
  label: {
    color: "white",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#2c4963",
    color: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#98c9ee",
    paddingVertical: 5,
  },
  pickerInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  inputText: {
    color: "white",
    flex: 1,
  },
  disabledText: {
    color: "#98c9ee",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#42779F",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "60%",
  },
  datePickerModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 0,
    width: "90%",
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalButtonText: {
    fontSize: 16,
    color: "#42779F",
  },
  doneButton: {
    fontWeight: "600",
  },
  dateTimePicker: {
    backgroundColor: "white",
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedOption: {
    backgroundColor: "#e8f4f8",
  },
  genderOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "#42779F",
    fontWeight: "600",
  },
});
