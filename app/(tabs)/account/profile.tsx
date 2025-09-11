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
  Alert,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { shadows } from "~/utils/shadow";
import { useUserStore } from "../../../store/useUserStore";

type ProfileFormData = {
  firstName: string;
  lastName: string;
  birthdate: Date;
  age: string;
  gender: string;
  email: string;
};

const genderOptions = ["male", "female"] as const;

const calculateAge = (birthDate: Date): string => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return String(age);
};

export default function ProfileScreen() {
  const router = useRouter();

  const { user, isLoaded, isSignedIn } = useUser();
  const userId = user?.id;

  const {
    user: userProfile,
    setUserData,
    loadUserDataFromFirestore,
    saveUserDataToFirestore,
    isLoading: storeLoading,
    error: storeError,
  } = useUserStore();

  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [editedProfile, setEditedProfile] = useState<ProfileFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data 
  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoaded) return;
      if (!isSignedIn || !userId) {
        Alert.alert("Error", "User not logged in. Please log in again.");
        return;
      }
      try {
        setIsLoading(true);
        await loadUserDataFromFirestore(userId);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load user data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [isLoaded, isSignedIn, userId, loadUserDataFromFirestore]);

  // Update local state
  useEffect(() => {
    if (userProfile) {
      const rawBirthday: any = (userProfile as any)?.birthday;
      const birthdate: Date =
        rawBirthday instanceof Date
          ? rawBirthday
          : rawBirthday?.toDate?.() || new Date(1999, 0, 15);

      const updatedProfile: ProfileFormData = {
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        birthdate,
        age: userProfile.age ? String(userProfile.age) : calculateAge(birthdate),
        gender: (userProfile.gender as string) || "male",
        email: userProfile.email || "",
      };

      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
    }
  }, [userProfile]);

  // Track if anything changed
  useEffect(() => {
    if (profile && editedProfile) {
      const changed =
        profile.firstName !== editedProfile.firstName ||
        profile.lastName !== editedProfile.lastName ||
        profile.gender !== editedProfile.gender ||
        profile.email !== editedProfile.email ||
        profile.age !== editedProfile.age ||
        profile.birthdate.getTime() !== editedProfile.birthdate.getTime();

      setHasChanges(changed);
    }
  }, [editedProfile, profile]);

  useEffect(() => {
    if (isEditing && editedProfile) {
      const newAge = calculateAge(editedProfile.birthdate);
      if (newAge !== editedProfile.age) {
        setEditedProfile(prev => (prev ? { ...prev, age: newAge } : prev));
      }
    }
  }, [editedProfile?.birthdate, isEditing]);

  const handleChange = (key: keyof ProfileFormData, value: string | Date) => {
    setEditedProfile(prev => (prev ? { ...prev, [key]: value as any } : prev));
  };

  const handleCancel = () => {
    if (profile) {
      setEditedProfile({ ...profile });
      setIsEditing(false);
      setHasChanges(false);
    }
  };

  const handleConfirm = async () => {
    if (!editedProfile || !userId) return;
    try {
      setIsSaving(true);

      const finalProfile: ProfileFormData = {
        ...editedProfile,
        age: calculateAge(editedProfile.birthdate),
      };

      setProfile(finalProfile);
      setEditedProfile(finalProfile);

      const storeData = {
        firstName: finalProfile.firstName,
        lastName: finalProfile.lastName,
        email: finalProfile.email,
        age: parseInt(finalProfile.age, 10),
        gender: finalProfile.gender as "male" | "female",
        birthday: finalProfile.birthdate,
      };

      setUserData(storeData);
      await saveUserDataToFirestore(userId);

      setIsEditing(false);
      setHasChanges(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing && profile) {
      setEditedProfile({ ...profile });
      setHasChanges(false);
    }
    setIsEditing(prev => !prev);
  };

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const onDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) handleChange("birthdate", selectedDate);
  };

  const handleDatePickerPress = () => {
    if (isEditing) setShowDatePicker(true);
  };

  const formatGenderDisplay = (gender: string): string =>
    gender.charAt(0).toUpperCase() + gender.slice(1);

  if (isLoading || storeLoading || !profile || !editedProfile) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "white", fontSize: 18 }}>Loading profile...</Text>
      </View>
    );
  }

  if (storeError && !user) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "white", fontSize: 16, textAlign: "center", marginBottom: 20 }}>
          {storeError}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => userId && loadUserDataFromFirestore(userId)}
        >
          <Text style={{ color: "white" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.scrollContainer}>
        {/* Header */}
        <View className="bg-[#42779F] rounded-[12] flex-1" style={shadows.large}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={30} color="white" />
            </TouchableOpacity>
            <View className="flex-column items-center ">
              <View className="bg-[#356182] rounded-[10] ml-10">
                <Ionicons className="m-2" name="person-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>About you</Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: isEditing ? "#98c9ee" : "#142939" }]}
              onPress={handleEditToggle}
              disabled={isSaving}
            >
              <Ionicons name="create" size={20} color={isEditing ? "#42779F" : "#73b5e8"} />
              <Text
                className="font-bold"
                style={{ color: isEditing ? "#42779F" : "#73b5e8", marginLeft: 5 }}
              >
                {isEditing ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            className="px-4 py-1"
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.informationWrapper}>
              {/* First name */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  editable={isEditing}
                  value={editedProfile.firstName}
                  onChangeText={text => handleChange("firstName", text)}
                  returnKeyType="next"
                  placeholder={!editedProfile.firstName ? "Enter your name" : ""}
                  placeholderTextColor="#98c9ee"
                />
              </View>

              {/* Last name */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  editable={isEditing}
                  value={editedProfile.lastName}
                  onChangeText={text => handleChange("lastName", text)}
                  returnKeyType="next"
                  placeholder={!editedProfile.lastName ? "Enter your name" : ""}
                  placeholderTextColor="#98c9ee"
                />
              </View>

              {/* Birthdate */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Birthdate</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerInput]}
                  onPress={handleDatePickerPress}
                  disabled={!isEditing}
                >
                  <Text style={[styles.inputText, !isEditing && styles.disabledText]}>
                    {formatDate(editedProfile.birthdate)}
                  </Text>
                  {isEditing && <Ionicons name="calendar-outline" size={20} color="#98c9ee" />}
                </TouchableOpacity>
              </View>

              {/* Age (read-only) */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Age</Text>
                <View style={[styles.input, styles.pickerInput]}>
                  <Text style={[styles.inputText, styles.disabledText]}>
                    {editedProfile.age} years old
                  </Text>
                </View>
              </View>

              {/* Gender */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Gender</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerInput]}
                  onPress={() => isEditing && setShowGenderPicker(true)}
                  disabled={!isEditing}
                >
                  <Text style={[styles.inputText, !isEditing && styles.disabledText]}>
                    {formatGenderDisplay(editedProfile.gender)}
                  </Text>
                  {isEditing && <Ionicons name="chevron-down-outline" size={20} color="#98c9ee" />}
                </TouchableOpacity>
              </View>

              {/* Email (read-only) */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.input, styles.pickerInput]}>
                  <Text style={[styles.inputText, styles.disabledText]}>
                    {editedProfile.email || "No email provided"}
                  </Text>
                  <Ionicons name="lock-closed-outline" size={16} color="#98c9ee" />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Buttons */}
          {isEditing && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSaving}>
                <Text style={{ color: "#333" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: hasChanges && !isSaving ? "#49a0e1" : "#a9a9a9" }]}
                disabled={!hasChanges || isSaving}
                onPress={handleConfirm}
              >
                <Text style={{ color: "white" }}>{isSaving ? "Saving..." : "Confirm"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="fade"
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
            {genderOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.genderOption, editedProfile.gender === option && styles.selectedOption]}
                onPress={() => {
                  handleChange("gender", option);
                  setShowGenderPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    editedProfile.gender === option && styles.selectedOptionText,
                  ]}
                >
                  {formatGenderDisplay(option)}
                </Text>
                {editedProfile.gender === option && <Ionicons name="checkmark" size={20} color="#42779F" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Android Date Picker */}
      {Platform.OS !== "ios" && showDatePicker && (
        <DateTimePicker
          value={editedProfile.birthdate}
          mode="date"
          display={Platform.OS === "android" ? "default" : "spinner"}
          onChange={onDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          themeVariant="light"
        />
      )}

      {/* iOS Date Picker */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal transparent animationType="fade" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Birthdate</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.modalButtonText, styles.doneButton]}>Done</Text>
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
                locale="en-US"
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
  container: { backgroundColor: "#84BDEA", flex: 1 },
  scrollContainer: { flex: 1, paddingHorizontal: 15 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 20 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 10, marginTop: 20, paddingBottom: 10, borderBottomColor: "#84BDEA", borderBottomWidth: 2,
  },
  title: { fontSize: 20, color: "white", fontWeight: "bold", textAlign: "center", marginLeft: 30, marginTop: 10 },
  editButton: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 5, width: 70, justifyContent: "center", marginRight: 10,
  },
  informationWrapper: { backgroundColor: "#2c4963", borderRadius: 12, padding: 15 },
  inputWrapper: { marginBottom: 15, backgroundColor: "#2c4963", borderRadius: 10, padding: 5 },
  label: { color: "white", marginBottom: 5, fontWeight: "500" },
  input: { backgroundColor: "#2c4963", color: "white", borderBottomWidth: 1, borderBottomColor: "#98c9ee", paddingVertical: 5 },
  pickerInput: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  inputText: { color: "white", flex: 1 },
  disabledText: { color: "#98c9ee" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 15, paddingBottom: 40 },
  cancelButton: { flex: 1, marginRight: 10, backgroundColor: "#e0e0e0", padding: 12, borderRadius: 8, alignItems: "center" },
  confirmButton: { flex: 1, marginLeft: 10, backgroundColor: "#42779F", padding: 12, borderRadius: 8, alignItems: "center" },
  retryButton: { backgroundColor: "#42779F", padding: 12, borderRadius: 8, alignItems: "center", minWidth: 100 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "white", borderRadius: 12, padding: 20, width: "80%", maxHeight: "60%" },
  datePickerModalContent: { backgroundColor: "white", borderRadius: 12, padding: 0, width: "90%", maxHeight: "50%" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e0e0e0",
    paddingHorizontal: 20, paddingTop: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  modalButtonText: { fontSize: 16, color: "#42779F" },
  doneButton: { fontWeight: "600" },
  dateTimePicker: { backgroundColor: "white" },
  genderOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 15, paddingHorizontal: 10, borderRadius: 8, marginBottom: 5,
  },
  selectedOption: { backgroundColor: "#e8f4f8" },
  genderOptionText: { fontSize: 16, color: "#333" },
  selectedOptionText: { color: "#42779F", fontWeight: "600" },
});
