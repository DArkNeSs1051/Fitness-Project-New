import React, { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import { useUser } from "@clerk/clerk-expo";
import { useNavigation } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "~/firebase";
import { useFitnessFormStore } from "~/store/useFitnessFormStore";
import { useUserStore } from "~/store/useUserStore";

export default function MFTTestScreen() {
  const webviewRef = useRef<WebView>(null);
  const formGender = useFitnessFormStore((s) => s.form?.gender);
  const setForm = useFitnessFormStore((s) => s.setForm);
  const profileGender = useUserStore((s) => s.user?.gender);

  const { user } = useUser();
  const navigation = useNavigation();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      let effectiveGender: string | undefined =
        profileGender ?? formGender;

      try {
        if (user?.id) {
          const userRef = doc(FIRESTORE_DB, "users", user.id);
          const snap = await getDoc(userRef);
          if (!cancelled && snap.exists()) {
            const dbGender = snap.data()?.gender as string | undefined;
            if (dbGender) {
              effectiveGender = dbGender;
              if (dbGender !== formGender) {
                setForm(() => ({ gender: dbGender }));
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load user gender:", e);
      }

      const sendToWeb = () => {
        const payload = {
          type: "FROM_TEST",
          gender: effectiveGender ?? formGender ?? "unknown",
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
      };

      sendToWeb();
      intervalId = setInterval(sendToWeb, 2000);
    };

    run();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.id, profileGender, formGender, setForm]);

  const onMessage = (event: any) => {
    try {
      const text = event?.nativeEvent?.data;
      if (!text) return;
      const parsed = JSON.parse(text);
      if (parsed?.level) {
        setForm((prev: any) => ({
          ...prev,
          level: parsed.level,
          index: 3,
        }));
        setOk(true);
      }
    } catch (e) {
      console.warn("Failed to parse message from WebView:", e);
    }
  };

  useEffect(() => {
    const saveLevel = async () => {
      if (!user?.id) return;
      const level = useFitnessFormStore.getState().form?.level;
      if (!level || !ok) return;

      try {
        const docRef = doc(FIRESTORE_DB, "users", user.id);
        await setDoc(
          docRef,
          {
            level,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error("Failed to save level:", e);
      }
    };

    saveLevel();
  }, [user?.id, ok]);

  useEffect(() => {
    if (!ok) return;
    const timer = setTimeout(() => {
      navigation.goBack();
    }, 10000);
    return () => clearTimeout(timer);
  }, [ok, navigation]);

  return (
    <WebView
      ref={webviewRef}
      style={{ flex: 1 }}
      source={{ uri: "https://newcamera-pi.vercel.app/" }}
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      javaScriptEnabled
      allowsFullscreenVideo
      domStorageEnabled
      originWhitelist={["*"]}
      allowFileAccess
      allowUniversalAccessFromFileURLs
      mediaCapturePermissionGrantType="grant"
      onShouldStartLoadWithRequest={(req) => {
        const clean = (s:string) => s.replace(/\/+$/, '');
        return clean(req.url).startsWith(clean("https://newcamera-pi.vercel.app/"));
      }}
      onMessage={onMessage}
    />
  );
}
