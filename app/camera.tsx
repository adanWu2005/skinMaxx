import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Camera, Image as ImageIcon, X, FlipHorizontal, Zap, ZapOff } from "lucide-react-native";
import { useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { validateImageLighting } from "@/utils/imageValidation";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("front");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.permissionContainer}>
            <Camera size={64} color={Colors.dark.primary} />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              We need camera access to capture photos for AI-powered skin analysis. Your photos are processed securely and never shared without your permission.
            </Text>
            <Pressable style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo) return;

      if (Platform.OS === "web") {
        const validation = await validateImageLighting(photo.uri);
        if (!validation.isValid) {
          Alert.alert(
            "Lighting Too Poor",
            "Please find better lighting for accurate analysis."
          );
          return;
        }
      }

      router.push({
        pathname: "/results" as any,
        params: { imageUri: photo.uri },
      });
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        if (Platform.OS === "web") {
          const validation = await validateImageLighting(imageUri);
          if (!validation.isValid) {
            Alert.alert(
              "Lighting Too Poor",
              "Please select an image with better lighting for accurate analysis."
            );
            return;
          }
        }

        router.push({
          pathname: "/results" as any,
          params: { imageUri },
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => {
      if (current === "off") return "on";
      if (current === "on") return "auto";
      return "off";
    });
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} flash={flash} ref={cameraRef}>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.overlay}>
            <View style={styles.topControls}>
              <Pressable style={styles.flashButton} onPress={toggleFlash}>
                {flash === "off" ? (
                  <ZapOff size={28} color={Colors.dark.text} />
                ) : (
                  <Zap size={28} color={flash === "on" ? Colors.dark.primary : Colors.dark.text} />
                )}
                <Text style={styles.flashText}>
                  {flash === "off" ? "Off" : flash === "on" ? "On" : "Auto"}
                </Text>
              </Pressable>
              <Pressable style={styles.closeIconButton} onPress={() => router.back()}>
                <X size={28} color={Colors.dark.text} />
              </Pressable>
            </View>

            <View style={styles.guideContainer}>
              <View style={styles.guideBorder} />
              <Text style={styles.guideText}>Position your face in the frame</Text>
            </View>

            <View style={styles.controls}>
              <Pressable style={styles.galleryButton} onPress={pickImage}>
                <ImageIcon size={28} color={Colors.dark.text} />
              </Pressable>

              <Pressable style={styles.captureButton} onPress={takePicture}>
                <LinearGradient
                  colors={[Colors.dark.primary, Colors.dark.primaryDim]}
                  style={styles.captureButtonInner}
                />
              </Pressable>

              <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
                <FlipHorizontal size={28} color={Colors.dark.text} />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  camera: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 70,
    marginBottom: 20,
  },
  flashButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  flashText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark.text,
  },
  closeIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  guideContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  guideBorder: {
    width: 280,
    height: 360,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    borderRadius: 140,
    opacity: 0.6,
  },
  guideText: {
    marginTop: 24,
    fontSize: 16,
    color: Colors.dark.text,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.text,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 4,
    backgroundColor: Colors.dark.text,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 36,
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.text,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.dark.text,
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  closeButton: {
    padding: 12,
  },
  closeButtonText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
});
