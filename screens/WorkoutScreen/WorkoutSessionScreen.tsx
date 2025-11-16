import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { TExercise } from "./WorkoutIndexScreen";
import { useEffect, useRef, useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { WebView } from "react-native-webview";
import { FIRESTORE_DB } from "~/firebase";
import * as Speech from "expo-speech";
import { useUser } from "@clerk/clerk-expo";
import { useNavigation } from "expo-router";

interface IWorkoutSessionScreen {
  id: string;
  workoutExercise: TExercise[];
}

const WorkoutSession = (props: IWorkoutSessionScreen) => {
  const { id, workoutExercise } = props;
  const webviewRef = useRef<WebView>(null);

  // useEffect(() => {
  //   const message = JSON.stringify({
  //     type: "FROM_APP",
  //     payload: number,
  //   });
  //   const jsCode = `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
  //     message
  //   )} })); true;`;
  //   webviewRef.current?.injectJavaScript(jsCode);
  // }, [number]);

  // useEffect(() => {
  //   if (timer !== null) {
  //     const message = JSON.stringify({
  //       type: "FROM_APP",
  //       payload: timer,
  //     });

  //     const jsCode = `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
  //       message
  //     )} })); true;`;

  //     webviewRef.current?.injectJavaScript(jsCode);
  //   }
  // }, [timer]);

  // const loadWorkoutExercise = () => {
  //   const message = JSON.stringify({
  //     type: "FROM_APP",
  //     payload: workoutExercise,
  //   });

  //   const jsCode = `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
  //     message
  //   )} })); true;`;

  //   webviewRef.current?.injectJavaScript(jsCode);
  // };

  // const sendToWeb = () => {
  //   const message = JSON.stringify({
  //     type: "FROM_APP",
  //     payload: workoutExercise,
  //   });
  //   const jsCode = `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
  //     message
  //   )} })); true;`;
  //   webviewRef.current?.injectJavaScript(jsCode);
  // };

  const [b, setB] = useState<{ [field: string]: any }[] | undefined>(undefined);

  useEffect(() => {
    const interval = setInterval(() => {
      const payload = {
        type: "FROM_APP",
        payload: workoutExercise,
        video: b,
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
  }, [workoutExercise, b]);

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

  const { user } = useUser();
  const [ok, setOk] = useState(false);

  const onMessage = (event: any) => {
    const text = event.nativeEvent.data;
    const parsed = JSON.parse(text);
    if (parsed.success) setOk(parsed.success);
    Speech.speak(parsed.message, {
      language: "th-TH",
      voice: "th-th-x-thd-network",
    }); // ✅ พูดเสียงภาษาไทย
  };

  useEffect(() => {
    const findId = async () => {
      if (!user?.id) return;

      const docRef = doc(FIRESTORE_DB, "users", user.id, "routines", id);

      if (ok) {
        await setDoc(docRef, { completed: ok }, { merge: true });
      }
    };

    findId();
  }, [user, id, ok]);

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
    <View className="relative flex-1">
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
        mediaCapturePermissionGrantType="grant"
        onShouldStartLoadWithRequest={(req) => {
          const clean = (s:string) => s.replace(/\/+$/, '');
          return clean(req.url).startsWith(clean("https://newcamera-pi.vercel.app/"));
        }}
        // onMessage={(event) => {
        //   try {
        //     const data = JSON.parse(event.nativeEvent.data);
        //     console.log("📨 Received from Web:", data);
        //     setA(data);
        //   } catch (error) {
        //     console.warn("❌ JSON parse failed:", event.nativeEvent.data);
        //   }
        // }}
        onMessage={onMessage}
        // onLoadEnd={sendToWeb}
      />
    </View>
  );
};

export default WorkoutSession;