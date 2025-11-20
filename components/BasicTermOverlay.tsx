import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BasicTermsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function BasicTermsOverlay({
  visible,
  onClose,
}: BasicTermsOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.9);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.backdrop,
          { opacity },
        ]}
      >
        {/* กดพื้นหลัง = ปิด */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale }],
            },
          ]}
        >
          {/* ปุ่มปิด */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>

          <Text style={styles.title}>
            Basic Exercise Vocabulary{"\n"}(For Beginners)
          </Text>

          <View style={styles.termBlock}>
            <Text style={styles.termTitle}>Reps or Repetition (จำนวนครั้ง)</Text>
            <Text style={styles.termText}>
              The number of times you perform an exercise without stopping.
            </Text>
          </View>

          <View style={styles.termBlock}>
            <Text style={styles.termTitle}>Sets (จำนวนรอบ)</Text>
            <Text style={styles.termText}>
              A group of reps. Example: 3 sets × 10 reps = 10 reps, rest, repeat 2
              more times.
            </Text>
          </View>

          <View style={styles.termBlock}>
            <Text style={styles.termTitle}>Rest (เวลาพักระหว่างเซต)</Text>
            <Text style={styles.termText}>
              Break time between sets (e.g., Rest 60s).
            </Text>
          </View>

          <View style={styles.termBlock}>
            <Text style={styles.termTitle}>Form</Text>
            <Text style={styles.termText}>
              Correct technique while moving. Good form is more important than
              speed or weight.
            </Text>
          </View>

          <View style={styles.termBlock}>
            <Text style={styles.termTitle}>Range of Motion (ROM)</Text>
            <Text style={styles.termText}>
              How far you move through the exercise in a comfortable, controlled
              way.
            </Text>
          </View>

          <TouchableOpacity style={styles.mainButton} onPress={onClose}>
            <Text style={styles.mainButtonText}>I Understand</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    paddingRight: 24,
  },
  termBlock: {
    marginBottom: 8,
    backgroundColor: "#84BDEA",
    padding: 10,
    borderRadius: 12,
  },
  termTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#142939",
  },
  termText: {
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 2,
  },
  mainButton: {
    marginTop: 16,
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#84BDEA",
  },
  mainButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
