import React from 'react';
import { WebView } from 'react-native-webview';

export default function MFTTestScreen() {
  return (
      <WebView style={{flex: 1}} 
      source={{ uri: 'https://newcamera-pi.vercel.app/' }}
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback={true}
      javaScriptEnabled={true}
      allowsFullscreenVideo
      domStorageEnabled={true}
      originWhitelist={['*']}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
      useWebKit={true} 
      />
  );
}
