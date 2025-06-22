import { useSignUp } from "@clerk/clerk-expo";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Text, View } from "react-native";
import { twMerge } from "tailwind-merge";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import TextInputCustom from "~/components/BBComponents/TextInputCustom";
import Arrow from "../../assets/images/Image/Arrow.svg";
import { FIRESTORE_DB } from "../../firebaseconfig";

const classes = {
  title: twMerge("text-3xl font-bold text-[#142939]"),
};

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [pendingVerification, setPendingVerification] = useState(false);
  const [form, setForm] = useState({
    fistName: "",
    lastName: "",
    emailAddress: "",
    password: "",
    confirmPassword: "",
    code: "",
  });

  const onChangeForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const clickToSignIn = () => {
    router.push("/auth/signin");
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (form.password !== form.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      await signUp.create({
        firstName: form.fistName,
        lastName: form.lastName,
        emailAddress: form.emailAddress,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: form.code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });

        const createdUserId = signUpAttempt.createdUserId;

        if (createdUserId) {
          await setDoc(doc(FIRESTORE_DB, "users", createdUserId), {
            firstName: form.fistName,
            lastName: form.lastName,
            email: form.emailAddress,
            createdAt: dayjs().toISOString(),
            isFirstLogin: true,
          });

          router.replace("/workout");
        }
      } else {
        alert("Verification email sent. Please check your inbox.");
      }
    } catch (err) {
      alert("Verification failed. Please try again.");
    }
  };

  if (pendingVerification) {
    return (
      <View
        className={twMerge(
          "flex-1 items-center justify-center bg-[#84BDEA] gap-10"
        )}
      >
        <TextInputCustom
          value={form.code}
          title="Verification Code"
          placeholder="Enter the verification code"
          onChangeText={(text) => onChangeForm("code", text)}
        />
        <ButtonCustom
          text="Confirm Verification"
          textColor="#EEEEF0"
          bgColor="#142939"
          onClick={onVerifyPress}
        />
      </View>
    );
  }

  return (
    <View className={twMerge("flex-1 bg-[#84BDEA]")}>
      <View className="h-[70px] justify-center px-5">
        <Arrow onPress={clickToSignIn} />
      </View>
      <View className="flex flex-col gap-10 items-center">
        <Text className={classes.title}>Create Account</Text>

        <View className="flex flex-col gap-10">
          <TextInputCustom
            title="First Name"
            placeholder="Enter your first name"
            value={form.fistName}
            onChangeText={(text) => onChangeForm("fistName", text)}
          />
          <TextInputCustom
            title="Last Name"
            placeholder="Enter your last name"
            value={form.lastName}
            onChangeText={(text) => onChangeForm("lastName", text)}
          />
          <TextInputCustom
            title="Email"
            placeholder="Enter your email"
            value={form.emailAddress}
            onChangeText={(text) => onChangeForm("emailAddress", text)}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <TextInputCustom
            title="Password"
            placeholder="Enter your password"
            value={form.password}
            onChangeText={(text) => onChangeForm("password", text)}
            secureTextEntry
          />
          <TextInputCustom
            title="Confirm Password"
            placeholder="Enter your confirm password"
            value={form.confirmPassword}
            onChangeText={(text) => onChangeForm("confirmPassword", text)}
            secureTextEntry
          />
          <ButtonCustom
            text="Create Account"
            textColor="#EEEEF0"
            bgColor="#142939"
            onClick={onSignUpPress}
          />
        </View>
      </View>
    </View>
  );
};

export default SignUp;
