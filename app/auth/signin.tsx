import { useAuth, useOAuth, useSignIn, useUser } from "@clerk/clerk-expo";
import dayjs from "dayjs";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { twMerge } from "tailwind-merge";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import TextInputCustom from "~/components/BBComponents/TextInputCustom";
import GmailiconColor from "../../assets/images/Image/GmailiconColor.svg";
import { FIRESTORE_DB } from "../../firebase";
import { useRoutineStore } from "~/store/useRoutineStore";
import { useUserStore } from "~/store/useUserStore";

const SignIn: React.FC = () => {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { userId, isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [form, setForm] = useState({ emailAddress: "", password: "" });
  const [isFirebaseAuthenticating, setIsFirebaseAuthenticating] = useState(false);

  const onChangeForm = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const clickToSignUp = () => router.push("/auth/signup");
  const clickToForgotPassword = () => router.push("/auth/forgotPassword");

  const signIntoFirebaseWithClerk = async () => {
    const token = await getToken({ template: "integration_firebase" });
    if (!token) throw new Error("No Clerk token");

    const auth = getAuth();
    await signInWithCustomToken(auth, token);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("Firebase auth timeout"), 5000);
      const unsubscribe = onAuthStateChanged(auth, (usr) => {
        if (usr) {
          clearTimeout(timeout);
          unsubscribe();
          console.log("✅ Firebase auth state confirmed:", usr.uid);
          resolve(true);
        }
      });
    });

    const firebaseIdToken = await getAuth().currentUser?.getIdToken();
    console.log("✅ Firebase ID Token:", firebaseIdToken);
  };

  useEffect(() => {
    const checkOrCreateUser = async () => {
      if (!(authLoaded && isSignedIn && userId)) return;

      setIsFirebaseAuthenticating(true);
      try {
        console.log("🔄 Starting Firebase authentication process...");
        await signIntoFirebaseWithClerk();

        console.log("✅ Firebase auth done. Checking Firestore user doc...");
        const userRef = doc(FIRESTORE_DB, "users", userId);
        const userDocSnap = await getDoc(userRef);

        if (!userDocSnap.exists()) {
          await setDoc(userRef, {
            email: user?.primaryEmailAddress?.emailAddress || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            createdAt: dayjs().toISOString(),
            isFirstLogin: true,
          });
          console.log("✅ Created new user document in Firestore");
        } else {
          console.log("✅ Found user in Firestore:", userDocSnap.data());
        }

        const { reset: resetRoutine, fetchRoutineFromFirestore } = useRoutineStore.getState();
        const { reset: resetUser, loadUserDataFromFirestore } = useUserStore.getState();

        resetRoutine();
        resetUser();

        await Promise.all([
          fetchRoutineFromFirestore(userId),
          loadUserDataFromFirestore(userId),
        ]);

        console.log("✅ User setup completed, navigating to /workout...");
        setIsFirebaseAuthenticating(false);
        router.replace("/workout");
      } catch (error) {
        console.error("❌ Error in checkOrCreateUser:", error);
        setIsFirebaseAuthenticating(false);
        alert("Authentication error. Please try again.");
      }
    };

    checkOrCreateUser();
  }, [authLoaded, isSignedIn, userId]);

  // Clerk email/password sign in
  const onSignInPress = async () => {
    if (!signInLoaded) return;
    try {
      const attempt = await signIn.create({
        identifier: form.emailAddress,
        password: form.password,
      });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
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
      const complete = await startOAuthFlow({ redirectUrl });
      if (complete.authSessionResult?.type === "success" && complete.setActive) {
        await complete.setActive({ session: complete.createdSessionId });
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  if (!signInLoaded || !authLoaded || isFirebaseAuthenticating) {
    return (
      <View className="flex-1 items-center justify-center bg-[#84BDEA]">
        <ActivityIndicator size="large" color="#5FA3D6" />
        {isFirebaseAuthenticating && (
          <Text className="mt-4 text-center-[#142939] font-semibold">Setting up your account...</Text>
        )}
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
          Don't you have an account?{" "}
          <Text onPress={clickToSignUp} className="text-[#42779F] font-bold">
            Sign Up
          </Text>
        </Text>
        <Text
          onPress={clickToForgotPassword}
          className="text-[#42779F] text-[12px] font-bold"
        >
          Forgot your password?
        </Text>
      </View>
    </View>
  );
};

export default SignIn;
