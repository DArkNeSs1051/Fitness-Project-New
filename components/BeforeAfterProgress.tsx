import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FIREBASE_STORE as storage, FIRESTORE_DB as db } from "firebase";
import { useAuth } from "@clerk/clerk-expo";

type BeforeAfterData = {
  beforeUrl: string | null;
  afterUrl: string | null;
  beforeTakenAt?: any;
  afterTakenAt?: any;
  beforeWeight?: number | null;
  afterWeight?: number | null;
};

export function BeforeAfterProgress() {
  const { userId } = useAuth();
  const [data, setData] = useState<BeforeAfterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<"before" | "after" | null>(
    null
  );

  const [galleryStatus, requestGalleryPerm] =
    ImagePicker.useMediaLibraryPermissions();
  const [cameraStatus, requestCameraPerm] = ImagePicker.useCameraPermissions();

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const docRef = doc(db, "users", userId, "progressPhotos", "beforeAfter");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setData(snap.data() as BeforeAfterData);
        } else {
          setData({ beforeUrl: null, afterUrl: null });
        }
      } catch (e) {
        console.log("load error", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const handlePick = async (
    type: "before" | "after",
    source: "camera" | "gallery"
  ) => {
    if (!userId) return;

    if (source === "camera") {
      let status = cameraStatus;
      if (!status || !status.granted) {
        const res = await requestCameraPerm();
        status = res;
      }
      if (!status?.granted) {
        Alert.alert("Camera Permission", "Please allow permission to use camera.");
        return;
      }
    } else {
      let status = galleryStatus;
      if (!status || !status.granted) {
        const res = await requestGalleryPerm();
        status = res;
      }
      if (!status?.granted) {
        Alert.alert("Gallery Permission", "Please allow permission to reach gallery");
        return;
      }
    }

    setUploadingType(type);

    try {
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              cameraType: ImagePicker.CameraType.front,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });

      if (result.canceled || !result.assets?.[0]) {
        setUploadingType(null);
        return;
      }

      let asset = result.assets[0];

      if (source === "camera") {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ flip: ImageManipulator.FlipType.Horizontal }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        asset = { ...asset, uri: manipulated.uri };
      }

      const blob = await (await fetch(asset.uri)).blob();
      const path = `users/${userId}/progress/${type}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      const docRef = doc(db, "users", userId, "progressPhotos", "beforeAfter");
      const payload: any =
        type === "before"
          ? { beforeUrl: url, beforeTakenAt: serverTimestamp() }
          : { afterUrl: url, afterTakenAt: serverTimestamp() };

      await setDoc(docRef, payload, { merge: true });

      setData((prev) => ({
        ...(prev ?? { beforeUrl: null, afterUrl: null }),
        ...(type === "before" ? { beforeUrl: url } : { afterUrl: url }),
      }));
    } catch (e) {
      console.log("upload error", e);
    } finally {
      setUploadingType(null);
    }
  };

  const handleChooseSource = (type: "before" | "after") => {
    Alert.alert(
      type === "before" ? "Select Before Photo" : "Select After Photo",
      "Choose your method",
      [
        {
          text: "Select photo from Gallery",
          onPress: () => handlePick(type, "gallery"),
        },
        {
          text: "Take a photo",
          onPress: () => handlePick(type, "camera"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="p-4 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="bg-[#42779F] rounded-2xl p-4 gap-4">
      <Text style={{fontSize: 24, fontWeight: 'bold', color: '#e8eef3', marginBottom: 2}}>Before / After Progress</Text>

      <View className="flex-row gap-4">
        {/* BEFORE */}
        <View className="flex-1 items-center">
          <Text className="mb-2 font-medium text-white">Before</Text>

          <TouchableOpacity
            className="w-full aspect-[3/4] bg-gray-200 rounded-xl overflow-hidden items-center justify-center"
            onPress={() => handleChooseSource("before")}
          >
            {data?.beforeUrl ? (
              <Image source={{ uri: data.beforeUrl }} className="w-full h-full" />
            ) : (
              <Text className="text-gray-500 text-center px-2">
                Select Before Photo{"\n"}
                (Choose From Gallery or Take a Photo)
              </Text>
            )}

            {uploadingType === "before" && (
              <View className="absolute inset-0 bg-black/40 items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* AFTER */}
        <View className="flex-1 items-center">
          <Text className="mb-2 font-medium text-white">After</Text>

          <TouchableOpacity
            className="w-full aspect-[3/4] bg-gray-200 rounded-xl overflow-hidden items-center justify-center"
            onPress={() => handleChooseSource("after")}
          >
            {data?.afterUrl ? (
              <Image source={{ uri: data.afterUrl }} className="w-full h-full" />
            ) : (
              <Text className="text-gray-500 text-center px-2">
                Select After Photo{"\n"}
                (Choose From Gallery or Take a Photo)
              </Text>
            )}

            {uploadingType === "after" && (
              <View className="absolute inset-0 bg-black/40 items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
