import { useSignUp, useAuth } from "@clerk/clerk-expo";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { getAuth, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from "react-native";
import { twMerge } from "tailwind-merge";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import TextInputCustom from "~/components/BBComponents/TextInputCustom";
import Arrow from "../../assets/images/Image/Arrow.svg";
import { FIRESTORE_DB } from "../../firebase";

const classes = {
  title: twMerge("text-3xl font-bold text-[#142939]"),
};

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const router = useRouter();

  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    password: "",
    confirmPassword: "",
    code: "",
  });

  const onChangeForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const clickToSignIn = () => {
    router.push("/auth/signin");
  };

  const onSignUpPress = async () => {
    if (!isLoaded || submitting) return;

    if (form.password !== form.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setSubmitting(true);

      await signUp.create({
        firstName: form.firstName,
        lastName: form.lastName,
        emailAddress: form.emailAddress,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || submitting) return;

    try {
      setSubmitting(true);

      // Verify email code with Clerk
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: form.code.trim(),
      });
      console.log("Clerk verify result:", signUpAttempt?.status);

      if (signUpAttempt.status !== "complete") {
        alert("Verification email sent. Please check your inbox.");
        return;
      }

      // Activate Clerk session on this device
      await setActive({ session: signUpAttempt.createdSessionId });

      // Sign into Firebase using Clerk custom token (same template you use in SignIn)
      const customToken = await getToken({ template: "integration_firebase" });
      if (!customToken) throw new Error("Missing Clerk Firebase token");

      const auth = getAuth();
      await signInWithCustomToken(auth, customToken);

      // Wait for Firebase auth state so Firestore rules see request.auth
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Firebase auth timeout")), 7000);
        const unsub = onAuthStateChanged(auth, (u) => {
          if (u) {
            clearTimeout(timeout);
            unsub();
            resolve(true);
          }
        });
      });

      //  Now Firestore write is authorized
      const createdUserId = signUpAttempt.createdUserId;
      if (createdUserId) {
        await setDoc(doc(FIRESTORE_DB, "users", createdUserId), {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.emailAddress,
          createdAt: dayjs().toISOString(),
          isFirstLogin: true,
        });
      }

      // Navigate into the app
      router.replace("/workout");
    } catch (err: any) {
      console.log("onVerifyPress error:", err);
      alert(err?.message ?? "Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingVerification) {
    return (
      <View className={twMerge("flex-1 items-center justify-center bg-[#84BDEA] gap-10")}>
        <TextInputCustom
          value={form.code}
          title="Verification Code"
          placeholder="Enter the verification code"
          onChangeText={(text) => onChangeForm("code", text)}
        />
        <ButtonCustom
          text={submitting ? "Verifying..." : "Confirm Verification"}
          textColor="#EEEEF0"
          bgColor="#142939"
          onClick={onVerifyPress}
          disabled={submitting || !form.code.trim()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={45}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: "#84BDEA" }}>
          {/* Header */}
          <View className="h-[70px] justify-center px-5">
            <Arrow onPress={clickToSignIn} />
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-[#142939] text-center mb-4">
            Create Account
          </Text>

          {/* Inputs Scrollable */}
          <ScrollView
            contentContainerStyle={{
              marginTop: 50,
              justifyContent: "center",
              marginLeft: 65,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 20 }}>
              <TextInputCustom
                title="First Name"
                placeholder="Enter your first name"
                value={form.firstName}
                onChangeText={(text) => onChangeForm("firstName", text)}
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
                autoCapitalize="none"
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
                text={submitting ? "Creating..." : "Create Account"}
                textColor="#EEEEF0"
                bgColor="#142939"
                onClick={onSignUpPress}
                disabled={
                  submitting ||
                  !form.firstName.trim() ||
                  !form.lastName.trim() ||
                  !form.emailAddress.trim() ||
                  !form.password ||
                  !form.confirmPassword
                }
              />
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
