import React, { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import { useUser } from "@clerk/clerk-expo";
import { useNavigation } from "expo-router";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "~/firebase";
import { useFitnessFormStore } from "~/store/useFitnessFormStore";
import { useUserStore } from "~/store/useUserStore";

export default function MFTTestScreen() {
  const webviewRef = useRef<WebView>(null);
  const formGender = useFitnessFormStore((s) => s.form?.gender);
  const setForm = useFitnessFormStore((s) => s.setForm);
  const profileGender = useUserStore((s) => s.user?.gender);
  const profileAge = useUserStore((s) => s.user?.age);

  const { user } = useUser();
  const navigation = useNavigation();
  const [ok, setOk] = useState(false);

  const [b, setB] = useState<{ [field: string]: any }[] | undefined>(undefined);

  // ------------------------------------------------------------------------
  // โหลดข้อมูล exercises ก่อน
  // ------------------------------------------------------------------------
  useEffect(() => {
    const checkData = async () => {
      const userRef = collection(FIRESTORE_DB, "exercises");
      const userDocSnap = await getDocs(userRef);

      setB(
        userDocSnap.docs.map((doc) => ({
          ...doc.data(),
        }))
      );
    };

    checkData();
  }, []);

  // ------------------------------------------------------------------------
  // ส่งข้อมูลเข้า WebView (แก้ให้ b ทัน ค่าใหม่เสมอ)
  // ------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      let effectiveGender: string | undefined = profileGender ?? formGender;

      // โหลดข้อมูล gender/age จาก Firestore
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

            const dbAge = snap.data()?.age as string | undefined;
            if (dbAge !== undefined) {
              if (dbAge !== useFitnessFormStore.getState().form?.age) {
                setForm((prev: any) => ({ ...prev, age: dbAge }));
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load user gender:", e);
      }

      // รอจนกว่าจะมีค่า b ก่อนส่ง
      if (!b) return;

      const sendToWeb = () => {
        const payload = {
          type: "FROM_TEST",
          gender: effectiveGender ?? formGender ?? "unknown",
          age: profileAge ?? useFitnessFormStore.getState().form?.age ?? null,
          video: b ?? null,
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

      // ส่งครั้งแรกทันที
      sendToWeb();

      // ส่งทุก 2 วินาที (จะเห็นค่า b ใหม่ทุกครั้ง)
      intervalId = setInterval(sendToWeb, 2000);
    };

    run();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    user?.id,
    profileGender,
    formGender,
    profileAge,
    setForm,
    b, // ⭐ สำคัญสุด: ทำให้ effect รันใหม่เมื่อ b มีค่า
  ]);

  // ------------------------------------------------------------------------
  // รับ message จาก WebView
  // ------------------------------------------------------------------------
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

  // ------------------------------------------------------------------------
  // Save level เข้า Firestore
  // ------------------------------------------------------------------------
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

  // ------------------------------------------------------------------------
  // กลับหน้าก่อนหลังผ่าน 10 วิ
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!ok) return;
    const timer = setTimeout(() => {
      navigation.goBack();
    }, 10000);
    return () => clearTimeout(timer);
  }, [ok, navigation]);

  // ------------------------------------------------------------------------
  // Return WebView
  // ------------------------------------------------------------------------
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
        const clean = (s: string) => s.replace(/\/+$/, "");
        return clean(req.url).startsWith(
          clean("https://newcamera-pi.vercel.app/")
        );
      }}
      onMessage={onMessage}
    />
  );
}
