import { useAuth, useOAuth, useSignIn, useUser } from "@clerk/clerk-expo";
import dayjs from "dayjs";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithCustomToken } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { twMerge } from "tailwind-merge";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import TextInputCustom from "~/components/BBComponents/TextInputCustom";
import GmailiconColor from "../../assets/images/Image/GmailiconColor.svg";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../../firebase"; // Make sure to export FIREBASE_AUTH from your firebase config

const SignIn = () => {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { userId, isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({
    emailAddress: "",
    password: "",
  });

  const onChangeForm = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const clickToSignUp = () => {
    router.push("/auth/signup");
  };

  const clickToForgotPassword = () => {
    router.push("/auth/forgotPassword");
  };

  // Sign into Firebase with Clerk token
  const signIntoFirebaseWithClerk = async () => {
    try {
      console.log('🔄 Getting Clerk token...');
      const token = await getToken({ template: 'integrationfirebase' });
      
      if (token) {
        console.log('✅ Got Clerk token, signing into Firebase...');
        const userCredentials = await signInWithCustomToken(FIREBASE_AUTH, token);
        console.log('✅ Successfully signed into Firebase:', userCredentials.user.uid);
        return userCredentials.user;
      } else {
        console.log('❌ No Clerk token received');
        throw new Error('No Clerk token received');
      }
    } catch (error) {
      console.error('❌ Error signing into Firebase:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkOrCreateUser = async () => {
      if (authLoaded && isSignedIn && userId) {
        try {
          // First, sign into Firebase with Clerk token
          await signIntoFirebaseWithClerk();
          
          // Now Firebase operations will work
          const userRef = doc(FIRESTORE_DB, "users", userId);
          const userDocSnap = await getDoc(userRef);

          if (userDocSnap.exists()) {
            console.log("✅ พบใน Firestore:", userDocSnap.data());
          } else {
            console.log("❌ ไม่มีใน Firestore, ทำการสร้างใหม่");

            await setDoc(userRef, {
              email: user?.primaryEmailAddress?.emailAddress || "",
              firstName: user?.firstName || "",
              lastName: user?.lastName || "",
              createdAt: dayjs().toISOString(),
              isFirstLogin: true,
            });
            
            console.log("✅ สร้างผู้ใช้ใหม่ใน Firestore เรียบร้อย");
          }

          router.replace("/workout");
        } catch (error) {
          console.error("❌ Error in checkOrCreateUser:", error);
          // Handle error appropriately - maybe show an error message to user
        }
      }
    };

    checkOrCreateUser();
  }, [authLoaded, isSignedIn, userId]);

  const onSignInPress = async () => {
    if (!signInLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: form.emailAddress,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        // The useEffect will handle Firebase sign-in after Clerk sign-in
      } else {
        alert("Sign in failed");
      }
    } catch (err: any) {
      alert(err.message || "Sign in error");
    }
  };

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const onSignInGoogle = async () => {
    if (!authLoaded) return;
    try {
      const redirectUrl = Linking.createURL("/");
      const completeSignIn = await startOAuthFlow({ redirectUrl });

      if (completeSignIn.authSessionResult?.type === "success") {
        if (completeSignIn.setActive) {
          await completeSignIn.setActive({
            session: completeSignIn.createdSessionId,
          });
          // The useEffect will handle Firebase sign-in after Clerk sign-in
        }
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  if (!signInLoaded || !authLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
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
          Don't you have an account ?{" "}
          <Text onPress={clickToSignUp} className="text-[#42779F] font-bold">
            Sign Up
          </Text>
        </Text>
        <Text
          onPress={clickToForgotPassword}
          className="text-[#42779F] text-[12px] font-bold"
        >
          Forgot your password ?
        </Text>
      </View>
    </View>
  );
};

export default SignIn;