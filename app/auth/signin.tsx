import { useAuth, useOAuth, useSignIn, useUser } from "@clerk/clerk-expo";
import dayjs from "dayjs";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { twMerge } from "tailwind-merge";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import TextInputCustom from "~/components/BBComponents/TextInputCustom";
import GmailiconColor from "../../assets/images/Image/GmailiconColor.svg";
import { FIRESTORE_DB } from "../../firebaseconfig";

const SignIn = () => {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { userId, isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const checkOrCreateUser = async () => {
      if (authLoaded && isSignedIn && userId) {
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
          });
        }

        router.replace("/workout");
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
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL("/");
      const completeSignIn = await startOAuthFlow({ redirectUrl });

      if (completeSignIn.authSessionResult?.type === "success") {
        if (completeSignIn.setActive) {
          await completeSignIn.setActive({
            session: completeSignIn.createdSessionId,
          });
        }
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
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
          Don’t you have an account ?{" "}
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

      {/* <Text className="text-3xl font-bold mb-2">เข้าสู่ระบบ</Text>

      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="อีเมล"
        onChangeText={setEmailAddress}
        className="w-full max-w-xs p-3 rounded-md bg-gray-100 text-base"
      />

      <TextInput
        value={password}
        placeholder="รหัสผ่าน"
        secureTextEntry
        onChangeText={setPassword}
        className="w-full max-w-xs p-3 rounded-md bg-gray-100 text-base"
      />

      <TouchableOpacity
        onPress={onSignInPress}
        className="bg-blue-600 w-full max-w-xs p-3 rounded-lg items-center"
      >
        <Text className="text-white text-base font-semibold">เข้าสู่ระบบ</Text>
      </TouchableOpacity>

      <View className="flex-row gap-2 mt-4">
        <Text className="text-gray-700">ยังไม่มีบัญชี?</Text>
        <TouchableOpacity onPress={clickToSignUp}>
          <Text className="text-blue-600 font-semibold">สมัครใช้งาน</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

export default SignIn;
