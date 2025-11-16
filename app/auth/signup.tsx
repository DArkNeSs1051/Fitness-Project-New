import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { twMerge } from "tailwind-merge";
import { useSignUp, useAuth } from "@clerk/clerk-expo";

import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import TextInputCustom from "~/components/BBComponents/TextInputCustom";
import Arrow from "../../assets/images/Image/Arrow.svg";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace("/oauth-native-callback");
    }
  }, [authLoaded, isSignedIn]);

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

  const onChangeForm = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const clickToSignIn = async () => {
    if (isSignedIn) {
      try { await signOut(); } catch {}
    }
    router.replace("/auth/signin");
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
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        emailAddress: form.emailAddress.trim(),
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
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

      const attempt = await signUp.attemptEmailAddressVerification({
        code: form.code.trim(),
      });

      if (attempt.status !== "complete" || !attempt.createdSessionId) {
        alert("Verification failed. Please check the code and try again.");
        return;
      }

      await setActive({ session: attempt.createdSessionId });
      router.replace("/oauth-native-callback");
    } catch (err: any) {
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
          onChangeText={(t) => onChangeForm("code", t)}
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

          {/* Inputs */}
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
                onChangeText={(t) => onChangeForm("firstName", t)}
              />
              <TextInputCustom
                title="Last Name"
                placeholder="Enter your last name"
                value={form.lastName}
                onChangeText={(t) => onChangeForm("lastName", t)}
              />
              <TextInputCustom
                title="Email"
                placeholder="Enter your email"
                value={form.emailAddress}
                onChangeText={(t) => onChangeForm("emailAddress", t)}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                autoCapitalize="none"
              />
              <TextInputCustom
                title="Password"
                placeholder="Enter your password"
                value={form.password}
                onChangeText={(t) => onChangeForm("password", t)}
                secureTextEntry
              />
              <TextInputCustom
                title="Confirm Password"
                placeholder="Enter your confirm password"
                value={form.confirmPassword}
                onChangeText={(t) => onChangeForm("confirmPassword", t)}
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
