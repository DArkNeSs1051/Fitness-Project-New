import React, { useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { twMerge } from "tailwind-merge";
import { useSignIn, useAuth, useOAuth } from "@clerk/clerk-expo";
import { makeRedirectUri } from "expo-auth-session";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import TextInputCustom from "~/components/BBComponents/TextInputCustom";
import GmailiconColor from "../../assets/images/Image/GmailiconColor.svg";

const SignIn: React.FC = () => {
  const router = useRouter();

  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: authLoaded } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [form, setForm] = useState({ emailAddress: "", password: "" });
  const onChangeForm = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  // Email / Password
  const onSignInPress = async () => {
    if (!signInLoaded) return;
    try {
      const attempt = await signIn.create({
        identifier: form.emailAddress.trim(),
        password: form.password,
      });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/oauth-native-callback");
      } else {
        alert("Sign in failed");
      }
    } catch (err: any) {
      alert(err.message || "Sign in error");
    }
  };

  // Google OAuth
  const onSignInGoogle = async () => {
    if (!authLoaded) return;
    try {
      const redirectUrl = makeRedirectUri({
        scheme: "fit-health",          // ต้องตรงกับ app.config.js
        path: "oauth-native-callback", // ต้องตรงกับ Clerk allowlist
      });

      const { createdSessionId, setActive, authSessionResult } =
        await startOAuthFlow({ redirectUrl });

      if (authSessionResult?.type === "success" && createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/oauth-native-callback");
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  if (!signInLoaded || !authLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#84BDEA]">
        <ActivityIndicator size="large" color="#5FA3D6" />
      </View>
    );
  }

  return (
    <View
      className={twMerge(
        "bg-[#84BDEA] w-full h-full flex items-center justify-center gap-4"
      )}
    >
      <View className="!w-[185px] !h-[136px]">
        <Image
          source={require("../../assets/images/Image/Applogo.png")}
          className="!w-[185px] !h-[136px]"
        />
      </View>

      <View className="flex flex-col gap-2">
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
          autoComplete="password"
          textContentType="password"
        />
      </View>

      <View className="flex flex-col gap-2">
        <ButtonCustom
          text="Sign in"
          textColor="#EEEEF0"
          bgColor="#142939"
          onClick={onSignInPress}
        />
        <View className="flex flex-row items-center justify-center gap-2">
          <View className="w-[96px] h-[2px] bg-[#142939] mt-1" />
          <Text className="text-[#142939]">or</Text>
          <View className="w-[96px] h-[2px] bg-[#142939] mt-1" />
        </View>
        <ButtonCustom
          icon={<GmailiconColor />}
          text="Sign in with Google"
          textColor="#5FA3D6"
          onClick={onSignInGoogle}
        />
      </View>

      <View className="flex flex-col gap-2 w-[250px]">
        <Text className="text-[#000000] text-[12px]">
          Don't you have an account?{" "}
          <Text onPress={() => router.push("/auth/signup")} className="text-[#42779F] font-bold">
            Sign Up
          </Text>
        </Text>
        <Text
          onPress={() => router.push("/auth/forgotPassword")}
          className="text-[#42779F] text-[12px] font-bold"
        >
          Forgot your password?
        </Text>
      </View>
    </View>
  );
};

export default SignIn;
