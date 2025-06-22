import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { twMerge } from "tailwind-merge";
import ButtonCustom from "~/components/BBComponents/ButtonCustom";
import TextInputCustom from "~/components/BBComponents/TextInputCustom";
import Arrow from "../../assets/images/Image/Arrow.svg";

const classes = {
  title: twMerge("text-3xl font-bold text-[#142939]"),
};

const ForgotPassword = () => {
  const { signIn, setActive } = useSignIn();
  const router = useRouter();

  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [error, setError] = useState("");
  const [secondFactor, setSecondFactor] = useState(false);

  const [form, setForm] = useState({
    emailAddress: "",
    password: "",
    confirmPassword: "",
    code: "",
  });

  const clickToSignIn = () => {
    router.push("/auth/signin");
  };

  const onChangeForm = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const requestResetCode = async () => {
    try {
      await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: form.emailAddress,
      });
      setSuccessfulCreation(true);
      setError("");
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || "เกิดข้อผิดพลาด");
    }
  };

  const resetPassword = async () => {
    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!signIn) {
      setError("Sign in not initialized");
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: form.code,
        password: form.password,
      });

      if (result?.status === "needs_second_factor") {
        setSecondFactor(true);
        setError("");
      } else if (result?.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setError("");
        router.replace("/auth/signin");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || "เกิดข้อผิดพลาด");
    }
  };
  return (
    <View className={twMerge("flex-1 bg-[#84BDEA]")}>
      <View className="h-[70px] justify-center px-5">
        <Arrow onPress={clickToSignIn} />
      </View>
      <View className="flex flex-col gap-10 items-center">
        <Text className={classes.title}>Change Password</Text>
        <View className="flex flex-col gap-10 items-center">
          {!successfulCreation ? (
            <>
              <TextInputCustom
                title="Email"
                placeholder="Enter your email"
                value={form.emailAddress}
                onChangeText={(text) => onChangeForm("emailAddress", text)}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <ButtonCustom
                text="Send Code to Email"
                textColor="#EEEEF0"
                bgColor="#142939"
                onClick={requestResetCode}
              />
            </>
          ) : (
            <>
              <TextInputCustom
                title="Code"
                placeholder="Enter code from email"
                value={form.code}
                onChangeText={(text) => onChangeForm("code", text)}
              />
              <TextInputCustom
                title="New Password"
                placeholder="Enter new password"
                value={form.password}
                onChangeText={(text) => onChangeForm("password", text)}
                secureTextEntry
              />
              <TextInputCustom
                title="Confirm Password"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChangeText={(text) => onChangeForm("confirmPassword", text)}
                secureTextEntry
              />
              <ButtonCustom
                text="Reset Password"
                textColor="#EEEEF0"
                bgColor="#142939"
                onClick={resetPassword}
              />
            </>
          )}

          {error ? (
            <Text className="text-red-600 text-sm text-center">{error}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default ForgotPassword;
