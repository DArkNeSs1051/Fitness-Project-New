import { useUser } from "@clerk/clerk-expo";
import React, { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import { FIRESTORE_DB } from "~/firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useNavigation } from "expo-router";
import { useFitnessFormStore } from "~/store/useFitnessFormStore";

export default function MFTTestScreen() {
  const webviewRef = useRef<WebView>(null);
  const form = useFitnessFormStore((state) => state.form);
  const setForm = useFitnessFormStore((state) => state.setForm);

  useEffect(() => {
    const interval = setInterval(() => {
      const payload = {
        type: "FROM_TEST",
        gender: form.gender,
        // payload: workoutExercise,
        // video: b,
      };

      const jsCode = `
      window.dispatchEvent(
        new MessageEvent('message', {
          data: ${JSON.stringify(JSON.stringify(payload))}
        })
      );
      true;
    `;

      webviewRef.current?.injectJavaScript(jsCode);
    }, 2000); // ทุก 2 วินาที

    return () => clearInterval(interval);
  }, []);

  const { user } = useUser();
  const [ok, setOk] = useState(false);

  const onMessage = (event: any) => {
    const text = event.nativeEvent.data;
    const parsed = JSON.parse(text);
    if (parsed.level) {
      setForm((prev: any) => ({
        ...prev,
        level: parsed.level,
        index: 3,
      }));
      setOk(true);
    }
  };

  useEffect(() => {
    const findId = async () => {
      if (!user?.id) return;

      const docRef = doc(FIRESTORE_DB, "users", user.id);

      if (form.level && ok) {
        const updatedData = {
          level: form.level,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, updatedData, { merge: true });
      }
    };

    findId();
  }, [user, form, ok]);

  const navigation = useNavigation();

  useEffect(() => {
    if (ok) {
      const timer = setTimeout(() => {
        navigation.goBack(); // ✅ กลับหน้าก่อนหน้า
      }, 10000); // 10 วินาที = 10000 มิลลิวินาที

      return () => clearTimeout(timer); // cleanup ถ้า component unmount ก่อนครบเวลา
    }
  }, [ok]);

  return (
    <WebView
      ref={webviewRef}
      style={{ flex: 1 }}
      source={{ uri: "https://newcamera-pi.vercel.app/" }}
      // source={{ uri: "http://192.168.1.117:3000" }}
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback={true}
      javaScriptEnabled={true}
      allowsFullscreenVideo
      domStorageEnabled={true}
      originWhitelist={["*"]}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
      // injectedJavaScript={`
      //   window.localStorage.setItem('token', '${token}');
      //   window.dispatchEvent(new Event('storage'));
      //   true;
      // `}
      onMessage={onMessage}
    />
  );
}
