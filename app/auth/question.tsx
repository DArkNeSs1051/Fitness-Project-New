import { useUser } from "@clerk/clerk-expo";
import React, { useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import Arrow from "../../assets/images/Image/Arrow.svg";
import MaleIcon from "../../assets/images/Image/MaleIcon.svg";
import MaleIconWhite from "../../assets/images/Image/MaleIconWhite.svg";
import FemaleIcon from "../../assets/images/Image/FemaleIcon.svg";
import FemaleIconWhite from "../../assets/images/Image/FemaleIconWhite.svg";
import Dumbbell from "../../assets/images/Image/Dumbbell.svg";
import DumbbellWhite from "../../assets/images/Image/DumbbellWhite.svg";
import FitnessGoal from "../../assets/images/Image/FitnessGoal.svg";
import GymPreferIcon from "../../assets/images/Image/GymPreferIcon.svg";
import GymPreferIconWhite from "../../assets/images/Image/GymPreferIconWhite.svg";
import HomePreferIcon from "../../assets/images/Image/HomePreferIcon.svg";
import HomePreferIconWhite from "../../assets/images/Image/HomePreferIconWhite.svg";
import Workout from "../../assets/images/Image/Workout.svg";
import NutritionIcon from "../../assets/images/Image/NutritionIcon.svg";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { FIRESTORE_DB } from "~/firebaseconfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { router } from "expo-router";

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

interface formInterface {
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
  //   tDeeTarget: string;
  activity: string;
  updatedAt: string;
}

const Question = () => {
  const { user } = useUser();
  const [states, setStates] = useState(1);
  const maxStates = 5;
  const [form, setForm] = useState<formInterface>({
    gender: "",
    age: "0",
    birthday: null,
    weight: "",
    weightUnit: "kg",
    height: "",
    heightUnit: "cm",
    level: "beginner",
    goal: "loseWeight",
    equipment: "noEquipment",
    // tDeeTarget: "normal",
    activity: "sedentary",
    updatedAt: "",
  });

  const [errors, setErrors] = useState({
    gender: "",
    birthday: "",
    weight: "",
    height: "",
  });

  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const onChangeForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    setErrors((prev) => {
      const newErrors = { ...prev };

      switch (key) {
        case "gender":
          newErrors.gender = value ? "" : "กรุณาเลือกเพศ";
          break;
        case "weight":
          newErrors.weight = /^\d+$/.test(value)
            ? ""
            : "กรุณากรอกน้ำหนักเป็นตัวเลข";
          break;
        case "height":
          newErrors.height = /^\d+$/.test(value)
            ? ""
            : "กรุณากรอกส่วนสูงเป็นตัวเลข";
          break;
      }

      return newErrors;
    });
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

  const upDateUser = async () => {
    if (!user?.id) return;

    try {
      const userRef = doc(FIRESTORE_DB, "users", user.id);
      const userDocSnap = await getDoc(userRef);

      if (userDocSnap.exists()) {
        await setDoc(
          userRef,
          {
            gender: form.gender,
            age: form.age,
            birthday: form.birthday,
            weight: form.weight,
            weightUnit: form.weightUnit,
            height: form.height,
            heightUnit: form.heightUnit,
            level: form.level,
            goal: form.goal,
            equipment: form.equipment,
            // tDeeTarget: form.tDeeTarget,
            activity: form.activity,
            updatedAt: new Date().toISOString(),
            isFirstLogin: false,
          },
          { merge: true }
        );

        router.replace("/workout");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
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
                    onPress={() => setShowGenderPicker(true)}
                  />
                </TouchableOpacity>
              </View>
              {errors.birthday ? (
                <Text className="text-red-500 text-sm ml-2">
                  {errors.birthday}
                </Text>
              ) : null}
            </View>
            {showGenderPicker && (
              <DateTimePicker
                value={form.birthday ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    const ageYear = dayjs()
                      .diff(dayjs(selectedDate), "year")
                      .toString();
                    setForm((prev) => ({
                      ...prev,
                      birthday: selectedDate,
                      age: ageYear,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      birthday: "",
                    }));
                    setShowGenderPicker(false);
                  }
                }}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                themeVariant="light"
              />
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
                  >
                    <Text className={unitButtonStyle(form.weightUnit === "kg")}>
                      KG
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-[#142939] text-[30px]">/</Text>
                  <TouchableOpacity
                    onPress={() => onChangeForm("weightUnit", "lbs")}
                    activeOpacity={1}
                  >
                    <Text
                      className={unitButtonStyle(form.weightUnit === "lbs")}
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
                  >
                    <Text className={unitButtonStyle(form.heightUnit === "cm")}>
                      CM
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-[#142939] text-[30px]">/</Text>
                  <TouchableOpacity
                    onPress={() => onChangeForm("heightUnit", "ft")}
                    activeOpacity={1}
                  >
                    <Text className={unitButtonStyle(form.heightUnit === "ft")}>
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
        <View className={classes.container}>
          <View className="flex flex-col gap-1">
            <Text className={classes.title}>What level are you in ?</Text>
          </View>
          <View className="flex flex-col gap-5">
            <Text className={classes.text}>Select your level</Text>
            <View className="flex flex-col gap-10 items-center justify-center pt-10">
              <View className="h-[60px]">
                <TouchableOpacity
                  activeOpacity={1}
                  className={twMerge(
                    classes.boxRounded2,
                    form.level === "beginner" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("level", "beginner")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.level === "beginner" && "text-[#FDFDFF]"
                    )}
                  >
                    Beginner
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.level === "beginner" &&
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
                    form.level === "intermediate" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("level", "intermediate")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.level === "intermediate" && "text-[#FDFDFF]"
                    )}
                  >
                    Intermediate
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.level === "intermediate" &&
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
                    form.level === "advance" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("level", "advance")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.level === "advance" && "text-[#FDFDFF]"
                    )}
                  >
                    Advance
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.level === "advance" &&
                        "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                    )}
                  ></View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
                    form.goal === "loseWeight" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("goal", "loseWeight")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.goal === "loseWeight" && "text-[#FDFDFF]"
                    )}
                  >
                    Lose weight
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.goal === "loseWeight" &&
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
                    form.goal === "gainMuscle" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("goal", "gainMuscle")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.goal === "gainMuscle" && "text-[#FDFDFF]"
                    )}
                  >
                    Gain Muscle
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.goal === "gainMuscle" &&
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
                    form.goal === "maintainWeight" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("goal", "maintainWeight")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.goal === "maintainWeight" && "text-[#FDFDFF]"
                    )}
                  >
                    Maintain Weight
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.goal === "maintainWeight" &&
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
                    form.equipment === "noEquipment" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("equipment", "noEquipment")}
                >
                  <View className="absolute left-5">
                    {form.equipment === "noEquipment" ? (
                      <HomePreferIconWhite />
                    ) : (
                      <HomePreferIcon />
                    )}
                  </View>
                  <Text
                    className={twMerge(
                      classes.text,
                      form.equipment === "noEquipment" && "text-[#FDFDFF]"
                    )}
                  >
                    No Equipment
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.equipment === "noEquipment" &&
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
                    form.equipment === "fullGym" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("equipment", "fullGym")}
                >
                  <View className="absolute left-5">
                    {form.equipment === "fullGym" ? (
                      <GymPreferIconWhite />
                    ) : (
                      <GymPreferIcon />
                    )}
                  </View>
                  <Text
                    className={twMerge(
                      classes.text,
                      form.equipment === "fullGym" && "text-[#FDFDFF]"
                    )}
                  >
                    Full Gym
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.equipment === "fullGym" &&
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
                    form.equipment === "dumbbell" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("equipment", "dumbbell")}
                >
                  <View className="absolute left-5 w-[32px] h-[32px] items-center justify-center">
                    {form.equipment === "dumbbell" ? (
                      <DumbbellWhite />
                    ) : (
                      <Dumbbell />
                    )}
                  </View>
                  <Text
                    className={twMerge(
                      classes.text,
                      form.equipment === "dumbbell" && "text-[#FDFDFF]"
                    )}
                  >
                    Dumbbell
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.equipment === "dumbbell" &&
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
      {/* {states === 5 && (
        <View className={classes.container}>
          <View className="flex flex-col gap-1">
            <Text className={classes.title}>
              Which diet method do you prefer ?
            </Text>
          </View>
          <View className="flex items-center justify-center">
            <NutritionIcon />
          </View>
          <View className="flex flex-col gap-5">
            <Text className={classes.text}>Select the method</Text>
            <View className="flex flex-col gap-10 items-center justify-center pt-10">
              <View className="h-[60px]">
                <TouchableOpacity
                  activeOpacity={1}
                  className={twMerge(
                    classes.boxRounded2,
                    form.tDeeTarget === "normal" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("tDeeTarget", "normal")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.tDeeTarget === "normal" && "text-[#FDFDFF]"
                    )}
                  >
                    Normal
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.tDeeTarget === "normal" &&
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
                    form.tDeeTarget === "intermittentFasting" &&
                      "border-[#FDFDFF]"
                  )}
                  onPress={() =>
                    onChangeForm("tDeeTarget", "intermittentFasting")
                  }
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.tDeeTarget === "intermittentFasting" &&
                        "text-[#FDFDFF]"
                    )}
                  >
                    Intermittent Fasting
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.tDeeTarget === "intermittentFasting" &&
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
                    form.tDeeTarget === "ketogenic" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("tDeeTarget", "ketogenic")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.tDeeTarget === "ketogenic" && "text-[#FDFDFF]"
                    )}
                  >
                    Ketogenic (Keto)
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.tDeeTarget === "ketogenic" &&
                        "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                    )}
                  ></View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )} */}
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
                    form.activity === "lightlyActive" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("activity", "lightlyActive")}
                >
                  <Text
                    className={twMerge(
                      classes.text,

                      form.activity === "lightlyActive" && "text-[#FDFDFF]"
                    )}
                  >
                    Lightly active (light exercise or sports 1-2 days/week)
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,

                      form.activity === "lightlyActive" &&
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
                    form.activity === "moderatelyActive" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("activity", "moderatelyActive")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.activity === "moderatelyActive" && "text-[#FDFDFF]"
                    )}
                  >
                    Moderately active (moderate exercise or sports 3-5
                    days/week)
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.activity === "moderatelyActive" &&
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
                    form.activity === "veryActive" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("activity", "veryActive")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.activity === "veryActive" && "text-[#FDFDFF]"
                    )}
                  >
                    Very active (hard exercise or sports 6-7 days/week)
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.activity === "veryActive" &&
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
                    form.activity === "extraActive" && "border-[#FDFDFF]"
                  )}
                  onPress={() => onChangeForm("activity", "extraActive")}
                >
                  <Text
                    className={twMerge(
                      classes.text,
                      form.activity === "extraActive" && "text-[#FDFDFF]"
                    )}
                  >
                    Extra active (very hard exercise, training twice a day)
                  </Text>
                  <View
                    className={twMerge(
                      classes.rounded,
                      form.activity === "extraActive" &&
                        "bg-[#FDFDFF] border-[0px] border-[#FDFDFF"
                    )}
                  ></View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
  );
};
export default Question;
