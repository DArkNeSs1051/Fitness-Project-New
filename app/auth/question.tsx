import { useAuth, useUser } from "@clerk/clerk-expo";
import { OPENAI_API_KEY } from "@env";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { router } from "expo-router";
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import OpenAI from "openai";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Progress from "react-native-progress";
import { twMerge } from "tailwind-merge";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import { FIRESTORE_DB, functions } from "~/firebase";
import Arrow from "../../assets/images/Image/Arrow.svg";
import Dumbbell from "../../assets/images/Image/Dumbbell.svg";
import DumbbellWhite from "../../assets/images/Image/DumbbellWhite.svg";
import FemaleIcon from "../../assets/images/Image/Femaleicon.svg";
import FemaleIconWhite from "../../assets/images/Image/FemaleIconWhite.svg";
import FitnessGoal from "../../assets/images/Image/Fitnessgoal.svg";
import GymPreferIcon from "../../assets/images/Image/GymPrefericon.svg";
import GymPreferIconWhite from "../../assets/images/Image/GymPreferIconWhite.svg";
import HomePreferIcon from "../../assets/images/Image/HomePrefericon.svg";
import HomePreferIconWhite from "../../assets/images/Image/HomePreferIconWhite.svg";
import MaleIcon from "../../assets/images/Image/Maleicon.svg";
import MaleIconWhite from "../../assets/images/Image/MaleIconWhite.svg";
import Workout from "../../assets/images/Image/Workout.svg";
import { shadows } from "~/utils/shadow";
import FitnessTestScreen from "../(tabs)/account/fitnessTest";
import { useFitnessFormStore } from "~/store/useFitnessFormStore";

const classes = {
  title: twMerge("text-3xl font-bold text-[#142939]"),
  text: twMerge("text-base text-[#142939]"),
  boxRounded: twMerge(
    "w-[96px] h-[96px] border-[1px] border-[#142939]  rounded-2xl flex items-center justify-center"
  ),
  boxRounded2: twMerge(
    "w-[250px] h-[50px] border-[1px] border-[#142939] rounded-2xl flex items-center justify-center relative"
  ),
  commonInputStyle: twMerge("border-b border-[#142939] flex-1 text-[#142939]"),
  container: twMerge("flex flex-col gap-10 px-16"),
  rounded: twMerge(
    "w-[16px] h-[16px] rounded-3xl absolute right-5 border-[#142939] border-[1px] "
  ),
};

export interface formInterface {
  gender: string;
  age: string;
  birthday: Date | null;
  weight: string;
  weightUnit: string;
  height: string;
  heightUnit: string;
  level: string;
  goal: string;
  equipment: string;
  activity: string;
  updatedAt: string;
  workoutDay: number;
  index: number;
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const Question = () => {
  const { user } = useUser();
  const form = useFitnessFormStore((state) => state.form);
  const setForm = useFitnessFormStore((state) => state.setForm);

  // const [form, setForm] = useState<formInterface>({
  //   gender: "",
  //   age: "0",
  //   birthday: null,
  //   weight: "",
  //   weightUnit: "kg",
  //   height: "",
  //   heightUnit: "cm",
  //   level: "beginner",
  //   goal: "lose weight",
  //   equipment: "None",
  //   activity: "sedentary",
  //   updatedAt: "",
  //   workoutDay: 1,
  //   index: 1,
  // });
  const [states, setStates] = useState(form.index);

  const maxStates = 6;

  const [errors, setErrors] = useState({
    gender: "",
    birthday: "",
    weight: "",
    height: "",
  });

  const [showDatePicker, setshowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(form.birthday ?? new Date());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userId, setUserId] = useState<string>("");

  const getProgressText = () => {
    if (progress < 30) return "Saving your information...";
    if (progress < 70)
      return "Hang tight! We’re generating the best plan just for you...";
    if (progress < 100) return "Finalizing...";
    return "Done!";
  };

  const handleDateConfirm = (selectedDate: Date) => {
    const ageYear = dayjs().diff(dayjs(selectedDate), "year").toString();
    setForm((prev: any) => ({
      ...prev,
      birthday: selectedDate,
      age: ageYear,
    }));
    setErrors((prev) => ({
      ...prev,
      birthday: "",
    }));
    setshowDatePicker(false);
  };

  const onChangeForm = (key: string, value: string | number) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));

    setErrors((prev) => {
      const newErrors = { ...prev };

      switch (key) {
        case "gender":
          newErrors.gender = value ? "" : "กรุณาเลือกเพศ";
          break;
        case "weight":
          newErrors.weight = /^\d+$/.test(String(value))
            ? ""
            : "กรุณากรอกน้ำหนักเป็นตัวเลข";
          break;
        case "height":
          newErrors.height = /^\d+$/.test(String(value))
            ? ""
            : "กรุณากรอกส่วนสูงเป็นตัวเลข";
          break;
      }

      return newErrors;
    });
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (!selectedDate) return;

    if (Platform.OS === "android") {
      handleDateConfirm(selectedDate);
    } else {
      setTempDate(selectedDate);
    }
  };

  const { getToken } = useAuth();
  const signIntoFirebaseWithClerk = async () => {
    const token = await getToken({ template: "integration_firebase" });

    if (!token) throw new Error("No Clerk token");

    const auth = getAuth();
    const userCredential = await signInWithCustomToken(auth, token);
    console.log(
      "✅ Firebase signInWithCustomToken completed:",
      userCredential.user.uid
    );

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Firebase auth state timeout"));
      }, 5000);

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser && firebaseUser.uid === userCredential.user.uid) {
          clearTimeout(timeout);
          unsubscribe();
          console.log("✅ Firebase auth state confirmed:", firebaseUser.uid);
          resolve(firebaseUser);
        }
      });
    });
  };

  const fetchWorkoutPlan = async () => {
    try {
      setLoading(true);
      setProgress(10);
      await signIntoFirebaseWithClerk();
      setProgress(30);

      const auth = getAuth();
      console.log("auth:", auth);
      if (!auth.currentUser)
        throw new Error("Firebase user not authenticated!");

      const generateWorkoutPlan = httpsCallable(
        functions,
        "generateWorkoutPlan"
      );
      const result = await generateWorkoutPlan({ userData: form });

      console.log("✅ Workout plan result:", result.data);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 500));
      router.replace("/workout");
    } catch (error) {
      console.error("❌ Error generating workout plan:", error);
      alert("เกิดข้อผิดพลาดในการสร้างแผนออกกำลังกาย");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const upDateUser = async () => {
    if (!user?.id) {
      console.log("❌ No user ID available");
      return;
    }

    try {
      setLoading(true);
      console.log("✅ Updating user data...");

      const userRef = doc(FIRESTORE_DB, "users", user.id);
      const userDocSnap = await getDoc(userRef);

      if (userDocSnap.exists()) {
        const updatedData = {
          gender: form.gender.toLocaleLowerCase(),
          age: form.age,
          birthday: form.birthday,
          weight: form.weight,
          weightUnit: form.weightUnit,
          height: form.height,
          heightUnit: form.heightUnit,
          level: form.level.toLocaleLowerCase(),
          goal: form.goal.toLocaleLowerCase(),
          equipment: form.equipment,
          activity: form.activity.toLocaleLowerCase(),
          workoutDay: form.workoutDay,
          updatedAt: new Date().toISOString(),
          isFirstLogin: false,
          isFirstPlan: true,
        };

        await setDoc(userRef, updatedData, { merge: true });
        console.log("✅ User data updated successfully");

        // ✅ Wait a moment for Firestore to sync, then generate workout plan
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await fetchWorkoutPlan();
      } else {
        console.log("❌ User document does not exist");
        alert("ไม่พบข้อมูลผู้ใช้");
      }
    } catch (error) {
      console.error("❌ Error updating user:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleNextState = () => {
    if (states === 1) {
      const isValid = validateForm();
      if (!isValid) return;
    }

    if (states < maxStates) {
      setStates((prev) => prev + 1);
    }

    if (states === maxStates) {
      upDateUser();
    }
  };

  const handlePrevState = () => {
    if (states > 1) {
      setStates(states - 1);
    }
  };

  const unitButtonStyle = (active: boolean) =>
    twMerge(
      "flex flex-col justify-center items-center align-middle text-center rounded-md border text-[10px] h-[36px] w-[40px]",
      active
        ? " text-[#FDFDFF] border-[#FDFDFF]"
        : "text-[#142939] border-[#142939] "
    );

  const validateForm = () => {
    const newErrors: typeof errors = {
      gender: "",
      birthday: "",
      weight: "",
      height: "",
    };

    if (states === 1) {
      newErrors.gender = form.gender ? "" : "กรุณาเลือกเพศ";
      newErrors.birthday = form.birthday ? "" : "กรุณาเลือกวันเกิด";
      newErrors.weight = /^\d+$/.test(form.weight) ? "" : "กรุณากรอกน้ำหนัก";
      newErrors.height = /^\d+$/.test(form.height) ? "" : "กรุณากรอกส่วนสูง";
    } else if (states === 2) {
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === "");
  };

  useEffect(() => {
    if (user?.id) {
      console.log("✅ User authenticated:", user.id);
      setUserId(user.id);
    } else {
      console.log("❌ User not authenticated");
    }
  }, [user?.id]);

  useEffect(() => {
    console.log("Loading state:", loading);
  }, [loading]);

  return loading ? (
    <View className="flex flex-1 justify-center items-center gap-6 bg-[#84BDEA]">
      <Progress.Circle
        size={200}
        progress={progress / 100}
        showsText
        color="#ffffff"
        thickness={8}
        borderWidth={2}
        unfilledColor="rgba(255, 255, 255, 0.3)"
        textStyle={{ color: "#fff", fontWeight: "bold" }}
      />
      <Text className="text-white animate-pulse text-[16px] text-center font-semibold px-8">
        {getProgressText()}
      </Text>
    </View>
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className={twMerge("flex-1 gap-5 bg-[#84BDEA]")}>
        <View className="h-[70px] flex flex-row justify-center items-center px-5 relative">
          {states !== 1 && (
            <View className="absolute left-5">
              <Arrow onPress={handlePrevState} />
            </View>
          )}
          <Text className="text-[#142939]">
            {states}/{maxStates}
          </Text>
        </View>
        {/* States 1 */}
        {states === 1 && (
          <View className={classes.container}>
            <View className="flex flex-col gap-1">
              <Text className={classes.title}>Hello {user?.fullName}!</Text>
              <Text className={classes.text}>Tell us more about yourself</Text>
            </View>
            <View className="flex flex-col gap-3">
              <Text className={classes.text}>Select your gender</Text>
              <View className="flex flex-row gap-8 items-center justify-center">
                <TouchableOpacity
                  activeOpacity={1}
                  className={twMerge(
                    classes.boxRounded,
                    errors.gender && "border-red-500",
                    form.gender === "male" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("gender", "male")}
                >
                  {form.gender === "male" ? <MaleIconWhite /> : <MaleIcon />}
                  <Text
                    className={twMerge(
                      classes.text,
                      form.gender === "male" && "text-[#FDFDFF]"
                    )}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={1}
                  className={twMerge(
                    classes.boxRounded,
                    errors.gender && "border-red-500",
                    form.gender === "female" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("gender", "female")}
                >
                  {form.gender === "female" ? (
                    <FemaleIconWhite />
                  ) : (
                    <FemaleIcon />
                  )}

                  <Text
                    className={twMerge(
                      classes.text,
                      form.gender === "female" && "text-[#FDFDFF]"
                    )}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex items-center">
                {errors.gender ? (
                  <Text className="text-red-500 text-sm ml-2">
                    {errors.gender}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="flex flex-col gap-3">
              {/* Age */}
              <View className="flex flex-col h-[100px]">
                <View className="flex flex-row items-center justify-between">
                  <Text>Age: {form.age ? `${form.age} Year` : "-"}</Text>
                  <TouchableOpacity>
                    <Ionicons
                      name="calendar-outline"
                      size={25}
                      color="#142939"
                      onPress={() => setshowDatePicker(true)}
                    />
                  </TouchableOpacity>
                </View>
                {errors.birthday ? (
                  <Text className="text-red-500 text-sm ml-2">
                    {errors.birthday}
                  </Text>
                ) : null}
              </View>
              {showDatePicker && (
                <>
                  {/* Android: show inline picker */}
                  {Platform.OS === "android" && (
                    <DateTimePicker
                      value={form.birthday ?? new Date()}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      themeVariant="light"
                    />
                  )}

                  {/* iOS: show modal */}
                  {Platform.OS === "ios" && (
                    <Modal
                      transparent
                      animationType="fade"
                      visible={showDatePicker}
                      onRequestClose={() => setshowDatePicker(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.datePickerModalContent}>
                          <View style={styles.modalHeader}>
                            <TouchableOpacity
                              onPress={() => setshowDatePicker(false)}
                            >
                              <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>
                              Select Birthdate
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleDateConfirm(tempDate)}
                            >
                              <Text
                                style={[
                                  styles.modalButtonText,
                                  styles.doneButton,
                                ]}
                              >
                                Done
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={tempDate}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            minimumDate={new Date(1900, 0, 1)}
                            themeVariant="light"
                            style={styles.dateTimePicker}
                          />
                        </View>
                      </View>
                    </Modal>
                  )}
                </>
              )}

              {/* Weight */}
              <View className="flex flex-col h-[100px]">
                <View className="flex flex-row items-center">
                  <TextInput
                    placeholder="Weight"
                    placeholderTextColor="#42779F"
                    className={twMerge(
                      classes.commonInputStyle,
                      errors.weight && "border-red-500"
                    )}
                    keyboardType="numeric"
                    value={form.weight}
                    onChangeText={(text) => onChangeForm("weight", text)}
                  />
                  <View className="flex-row items-center ml-2 gap-1">
                    <TouchableOpacity
                      onPress={() => onChangeForm("weightUnit", "kg")}
                      activeOpacity={1}
                      className={unitButtonStyle(form.weightUnit === "kg")}
                    >
                      <Text
                        className={twMerge(
                          "text-[10px] text-center",
                          form.weightUnit === "kg"
                            ? "text-[#FDFDFF]"
                            : "text-[#142939]"
                        )}
                      >
                        KG
                      </Text>
                    </TouchableOpacity>
                    <Text className="text-[#142939] text-[30px]">/</Text>
                    <TouchableOpacity
                      onPress={() => onChangeForm("weightUnit", "lbs")}
                      activeOpacity={1}
                      className={unitButtonStyle(form.weightUnit === "lbs")}
                    >
                      <Text
                        className={twMerge(
                          "text-[10px] text-center",
                          form.weightUnit === "lbs"
                            ? "text-[#FDFDFF]"
                            : "text-[#142939]"
                        )}
                      >
                        Lbs
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {errors.weight ? (
                  <Text className="text-red-500 text-sm ml-2">
                    {errors.weight}
                  </Text>
                ) : null}
              </View>

              {/* Height */}
              <View className="flex flex-col h-[100px]">
                <View className="flex flex-row items-center">
                  <TextInput
                    placeholder="Height"
                    placeholderTextColor="#42779F"
                    className={twMerge(
                      classes.commonInputStyle,
                      errors.height && "border-red-500"
                    )}
                    keyboardType="numeric"
                    value={form.height}
                    onChangeText={(text) => onChangeForm("height", text)}
                  />
                  <View className="flex-row items-center ml-2 gap-1">
                    <TouchableOpacity
                      onPress={() => onChangeForm("heightUnit", "cm")}
                      activeOpacity={1}
                      className={unitButtonStyle(form.heightUnit === "cm")}
                    >
                      <Text
                        className={twMerge(
                          "text-[10px] text-center",
                          form.heightUnit === "cm"
                            ? "text-[#FDFDFF]"
                            : "text-[#142939]"
                        )}
                      >
                        CM
                      </Text>
                    </TouchableOpacity>
                    <Text className="text-[#142939] text-[30px]">/</Text>
                    <TouchableOpacity
                      onPress={() => onChangeForm("heightUnit", "ft")}
                      activeOpacity={1}
                      className={unitButtonStyle(form.heightUnit === "ft")}
                    >
                      <Text
                        className={twMerge(
                          "text-[10px] text-center",
                          form.heightUnit === "ft"
                            ? "text-[#FDFDFF]"
                            : "text-[#142939]"
                        )}
                      >
                        Ft
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {errors.height ? (
                  <Text className="text-red-500 text-sm ml-2">
                    {errors.height}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )}
        {/* States 2 */}
        {states === 2 && (
          // <View className={classes.container}>
          //   <View className="flex flex-col gap-1">
          //     <Text className={classes.title}>What level are you in ?</Text>
          //   </View>

          //   <View className="flex flex-col gap-5">
          //     <Text className={classes.text}>Select your level</Text>
          //     <View className="flex flex-col gap-10 items-center justify-center pt-10">
          //       <View className="h-[60px]">
          //         <TouchableOpacity
          //           activeOpacity={1}
          //           className={twMerge(
          //             classes.boxRounded2,
          //             form.level === "beginner" && "border-[#FDFDFF]"
          //           )}
          //           onPress={() => onChangeForm("level", "beginner")}
          //         >
          //           <Text
          //             className={twMerge(
          //               classes.text,
          //               form.level === "beginner" && "text-[#FDFDFF]"
          //             )}
          //           >
          //             Beginner
          //           </Text>
          //           <View
          //             className={twMerge(
          //               classes.rounded,
          //               form.level === "beginner" &&
          //                 "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
          //             )}
          //           ></View>
          //         </TouchableOpacity>
          //       </View>
          //       <View className="h-[60px]">
          //         <TouchableOpacity
          //           activeOpacity={1}
          //           className={twMerge(
          //             classes.boxRounded2,
          //             form.level === "intermediate" && "border-[#FDFDFF]"
          //           )}
          //           onPress={() => onChangeForm("level", "intermediate")}
          //         >
          //           <Text
          //             className={twMerge(
          //               classes.text,
          //               form.level === "intermediate" && "text-[#FDFDFF]"
          //             )}
          //           >
          //             Intermediate
          //           </Text>
          //           <View
          //             className={twMerge(
          //               classes.rounded,
          //               form.level === "intermediate" &&
          //                 "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
          //             )}
          //           ></View>
          //         </TouchableOpacity>
          //       </View>
          //       <View className="h-[60px]">
          //         <TouchableOpacity
          //           activeOpacity={1}
          //           className={twMerge(
          //             classes.boxRounded2,
          //             form.level === "advance" && "border-[#FDFDFF]"
          //           )}
          //           onPress={() => onChangeForm("level", "advance")}
          //         >
          //           <Text
          //             className={twMerge(
          //               classes.text,
          //               form.level === "advance" && "text-[#FDFDFF]"
          //             )}
          //           >
          //             Advance
          //           </Text>
          //           <View
          //             className={twMerge(
          //               classes.rounded,
          //               form.level === "advance" &&
          //                 "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
          //             )}
          //           ></View>
          //         </TouchableOpacity>
          //       </View>
          //     </View>
          //   </View>
          // </View>
          <FitnessTestScreen onHideArrow form={form} />
        )}
        {/* States 3 */}
        {states === 3 && (
          <View className={classes.container}>
            <View className="flex flex-col gap-1">
              <Text className={classes.title}>What Your Fitness Goal ?</Text>
            </View>
            <View className="flex items-center justify-center">
              <FitnessGoal />
            </View>
            <View className="flex flex-col gap-5">
              <Text className={classes.text}>Select your Goal</Text>
              <View className="flex flex-col gap-10 items-center justify-center pt-10">
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      form.goal === "lose weight" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("goal", "lose weight")}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.goal === "lose weight" && "text-[#FDFDFF]"
                      )}
                    >
                      Lose weight
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.goal === "lose weight" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      form.goal === "gain muscle" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("goal", "gain muscle")}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.goal === "gain muscle" && "text-[#FDFDFF]"
                      )}
                    >
                      Gain Muscle
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.goal === "gain muscle" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      form.goal === "maintain weight" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("goal", "maintain weight")}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.goal === "maintain weight" && "text-[#FDFDFF]"
                      )}
                    >
                      Maintain Weight
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.goal === "maintain weight" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        {/* States 4 */}
        {states === 4 && (
          <View className={classes.container}>
            <View className="flex flex-col gap-1">
              <Text className={classes.title}>
                Where do you prefer to workout ?
              </Text>
            </View>
            <View className="flex items-center justify-center">
              <Workout />
            </View>
            <View className="flex flex-col gap-5">
              <Text className={classes.text}>Select the place</Text>
              <View className="flex flex-col gap-10 items-center justify-center pt-10">
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      form.equipment === "None" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("equipment", "None")}
                  >
                    <View className="absolute left-5">
                      {form.equipment === "None" ? (
                        <HomePreferIconWhite />
                      ) : (
                        <HomePreferIcon />
                      )}
                    </View>
                    <Text
                      className={twMerge(
                        classes.text,
                        form.equipment === "None" && "text-[#FDFDFF]"
                      )}
                    >
                      No Equipment
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.equipment === "None" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      form.equipment === "Full Gym" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("equipment", "Full Gym")}
                  >
                    <View className="absolute left-5">
                      {form.equipment === "Full Gym" ? (
                        <GymPreferIconWhite />
                      ) : (
                        <GymPreferIcon />
                      )}
                    </View>
                    <Text
                      className={twMerge(
                        classes.text,
                        form.equipment === "Full Gym" && "text-[#FDFDFF]"
                      )}
                    >
                      Full Gym
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.equipment === "Full Gym" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      form.equipment === "Dumbbell" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("equipment", "Dumbbell")}
                  >
                    <View className="absolute left-5 w-[32px] h-[32px] items-center justify-center">
                      {form.equipment === "Dumbbell" ? (
                        <DumbbellWhite />
                      ) : (
                        <Dumbbell />
                      )}
                    </View>
                    <Text
                      className={twMerge(
                        classes.text,
                        form.equipment === "Dumbbell" && "text-[#FDFDFF]"
                      )}
                    >
                      Dumbbell
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.equipment === "Dumbbell" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        {/* States 5 */}
        {states === 5 && (
          <View className={classes.container}>
            <View className="flex flex-col gap-1">
              <Text className={classes.title}>
                What is your typical activity level?
              </Text>
            </View>
            <View className="flex flex-col gap-5">
              <Text className={classes.text}>Select the activity</Text>
              <View className="flex flex-col gap-10 items-center justify-center">
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.activity === "sedentary" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("activity", "sedentary")}
                  >
                    <Text
                      className={twMerge(
                        classes.text,

                        form.activity === "sedentary" && "text-[#FDFDFF]"
                      )}
                    >
                      Sedentary (little or no exercise, desk job)
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.activity === "sedentary" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.activity === "lightly active" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("activity", "lightly active")}
                  >
                    <Text
                      className={twMerge(
                        classes.text,

                        form.activity === "lightly active" && "text-[#FDFDFF]"
                      )}
                    >
                      Lightly active (light exercise or sports 1-2 days/week)
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,

                        form.activity === "lightly active" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.activity === "moderately active" &&
                        "border-[#FDFDFF]"
                    )}
                    onPress={() =>
                      onChangeForm("activity", "moderately active")
                    }
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.activity === "moderately active" &&
                          "text-[#FDFDFF]"
                      )}
                    >
                      Moderately active (moderate exercise or sports 3-5
                      days/week)
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.activity === "moderately active" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.activity === "very active" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("activity", "very active")}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.activity === "very active" && "text-[#FDFDFF]"
                      )}
                    >
                      Very active (hard exercise or sports 6-7 days/week)
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.activity === "very active" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.activity === "extra active" && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("activity", "extra active")}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.activity === "extra active" && "text-[#FDFDFF]"
                      )}
                    >
                      Extra active (very hard exercise, training twice a day)
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.activity === "extra active" &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        {/* States 6 */}
        {states === 6 && (
          <ScrollView className={classes.container}>
            <View className="flex flex-col gap-1">
              <Text className={classes.title}>
                How many day you want to workout per week?
              </Text>
            </View>
            <View className="flex flex-col gap-5">
              <Text className={classes.text}>Select the day</Text>
              <View className="flex flex-col gap-10 items-center justify-center">
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.workoutDay === 1 && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("workoutDay", 1)}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.workoutDay === 1 && "text-[#FDFDFF]"
                      )}
                    >
                      1
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.workoutDay === 1 &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.workoutDay === 2 && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("workoutDay", 2)}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.workoutDay === 2 && "text-[#FDFDFF]"
                      )}
                    >
                      2
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.workoutDay === 2 &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.workoutDay === 3 && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("workoutDay", 3)}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.workoutDay === 3 && "text-[#FDFDFF]"
                      )}
                    >
                      3
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.workoutDay === 3 &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.workoutDay === 4 && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("workoutDay", 4)}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.workoutDay === 4 && "text-[#FDFDFF]"
                      )}
                    >
                      4
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.workoutDay === 4 &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.workoutDay === 5 && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("workoutDay", 5)}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.workoutDay === 5 && "text-[#FDFDFF]"
                      )}
                    >
                      5
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.workoutDay === 5 &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
                <View className="h-[60px]">
                  <TouchableOpacity
                    activeOpacity={1}
                    className={twMerge(
                      classes.boxRounded2,
                      "text-wrap pr-10 pl-4 w-[300px]",
                      form.workoutDay === 6 && "border-[#FDFDFF]"
                    )}
                    onPress={() => onChangeForm("workoutDay", 6)}
                  >
                    <Text
                      className={twMerge(
                        classes.text,
                        form.workoutDay === 6 && "text-[#FDFDFF]"
                      )}
                    >
                      6
                    </Text>
                    <View
                      className={twMerge(
                        classes.rounded,
                        form.workoutDay === 6 &&
                          "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                      )}
                    ></View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
        <View className="flex flex-1 items-center justify-center align-bottom">
          <ButtonCustom
            onClick={handleNextState}
            text="Continued"
            textColor="#EEEEF0"
            bgColor="#142939"
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};
export default Question;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  datePickerModalContent: {
    backgroundColor: "white",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  modalButtonText: {
    fontSize: 16,
    color: "#5FA3D6",
  },
  doneButton: {
    fontWeight: "bold",
  },
  dateTimePicker: {
    backgroundColor: "white",
  },
});
