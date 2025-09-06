import React, { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";

export default function MFTTestScreen() {
  const token = "abc123asdasdas";
  const webviewRef = useRef<WebView>(null);

  // const [b, setB] = useState<{ [field: string]: any }[] | undefined>(undefined);

  useEffect(() => {
    const interval = setInterval(() => {
      const payload = {
        type: "FROM_TEST",
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
    />
  );
}
