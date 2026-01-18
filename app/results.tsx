import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Sparkles, X, Droplet, Sun, Eye, Clock } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useScans, SurfaceTexture, PigmentationTone, Clarity, AgingStructure, SkinType } from "@/contexts/ScansContext";

export default function ResultsScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const { analyzeScan, saveScan } = useScans();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasShownError, setHasShownError] = useState(false);
  const [analysisData, setAnalysisData] = useState<{
    score: number;
    skinAge: number;
    skinType: SkinType;
    surfaceTexture: SurfaceTexture;
    pigmentationTone: PigmentationTone;
    clarity: Clarity;
    agingStructure: AgingStructure;
    radianceScore: number;
    hasRadianceBonus: boolean;
    smileProbability: number;
  } | null>(null);

  useEffect(() => {
    if (imageUri && !analysisData && !isAnalyzing && !analysisError && !hasShownError) {
      console.log("Starting analysis with imageUri:", imageUri);
      setIsAnalyzing(true);
      
      analyzeScan(imageUri)
        .then((data) => {
          console.log("Analysis successful:", data);
          setAnalysisData(data);
        })
        .catch((error) => {
          console.error("Analysis failed:", error);
          const errorMessage = error?.message || "Failed to analyze image";
          setAnalysisError(errorMessage);
          
          if (hasShownError) {
            console.log("Error already shown, skipping alert");
            return;
          }
          
          setHasShownError(true);
          
          if (errorMessage.includes("No face detected")) {
            Alert.alert(
              "No Face Detected",
              "We couldn't detect a face in the image. Please make sure your face is clearly visible and well-lit.",
              [
                {
                  text: "Main Menu",
                  onPress: () => {
                    router.dismissAll();
                    router.replace('/');
                  },
                  style: "cancel",
                },
                {
                  text: "Retake",
                  onPress: () => router.back(),
                },
              ],
              { cancelable: false }
            );
          } else if (errorMessage.includes("CONCURRENCY_LIMIT_EXCEEDED")) {
            Alert.alert(
              "Too Many Requests",
              "Please wait a moment before trying again.",
              [
                {
                  text: "Main Menu",
                  onPress: () => {
                    router.dismissAll();
                    router.replace('/');
                  },
                  style: "cancel",
                },
                {
                  text: "Retake",
                  onPress: () => router.back(),
                },
              ],
              { cancelable: false }
            );
          } else {
            Alert.alert(
              "Analysis Error",
              "Something went wrong during analysis. Please try again.",
              [
                {
                  text: "Main Menu",
                  onPress: () => {
                    router.dismissAll();
                    router.replace('/');
                  },
                  style: "cancel",
                },
                {
                  text: "Retake",
                  onPress: () => router.back(),
                },
              ],
              { cancelable: false }
            );
          }
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    }
  }, [imageUri, analysisData, isAnalyzing, analysisError, hasShownError, analyzeScan, router]);

  useEffect(() => {
    if (analysisData) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [analysisData, scaleAnim, fadeAnim]);

  const handleSave = async () => {
    if (analysisData && imageUri && user) {
      console.log("Saving scan with data:", {
        score: analysisData.score,
        skinAge: analysisData.skinAge,
        skinType: analysisData.skinType,
      });
      
      setIsSaving(true);
      
      try {
        await saveScan({
          userId: user.id,
          score: analysisData.score,
          skinAge: analysisData.skinAge,
          skinType: analysisData.skinType,
          surfaceTexture: analysisData.surfaceTexture,
          pigmentationTone: analysisData.pigmentationTone,
          clarity: analysisData.clarity,
          agingStructure: analysisData.agingStructure,
          radianceScore: analysisData.radianceScore,
          hasRadianceBonus: analysisData.hasRadianceBonus,
          imageUri,
        });
        
        console.log("Scan saved successfully");
        router.dismissAll();
        router.replace('/journal');
      } catch (error) {
        console.error("Failed to save scan:", error);
        Alert.alert('Error', 'Failed to save scan. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!imageUri) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.dark.background, Colors.dark.surface]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.dark.text} />
          </Pressable>
        </View>

        {isAnalyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Analyzing your skin...</Text>
          </View>
        ) : analysisError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to analyze image</Text>
            <Text style={styles.errorSubtext}>
              {analysisError || "Unknown error occurred"}
            </Text>
            <Pressable style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : analysisData ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />

            <Animated.View
              style={[
                styles.scoreCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <CircularProgress score={analysisData.score} />
              
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreLabel}>Overall Score</Text>
                <Text style={styles.scoreDescription}>
                  Your skin health and radiance combined
                </Text>
              </View>

              {analysisData.hasRadianceBonus && (
                <View style={styles.bonusBadge}>
                  <Sparkles size={16} color={Colors.dark.secondary} />
                  <Text style={styles.bonusText}>Radiance Bonus Activated!</Text>
                </View>
              )}
            </Animated.View>

            <Animated.View style={[styles.breakdown, { opacity: fadeAnim }]}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Skin Age</Text>
                <Text style={styles.infoValue}>{analysisData.skinAge} years</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Skin Type</Text>
                <Text style={styles.infoValue}>{analysisData.skinType}</Text>
              </View>

              <Text style={styles.breakdownTitle}>Detailed Analysis</Text>

              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Droplet size={20} color={Colors.dark.primary} />
                  </View>
                  <Text style={styles.categoryTitle}>Surface & Texture</Text>
                </View>
                <View style={styles.metricsGrid}>
                  <MetricItem label="Texture" value={analysisData.surfaceTexture.texture} />
                  <MetricItem label="Pores" value={analysisData.surfaceTexture.pores} />
                  <MetricItem label="Oiliness" value={analysisData.surfaceTexture.oiliness} />
                  <MetricItem label="Moisture" value={analysisData.surfaceTexture.moisture} />
                </View>
              </View>

              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Sun size={20} color={Colors.dark.primary} />
                  </View>
                  <Text style={styles.categoryTitle}>Pigmentation & Tone</Text>
                </View>
                <View style={styles.metricsGrid}>
                  <MetricItem label="Spots" value={analysisData.pigmentationTone.spots} />
                  <MetricItem label="Redness" value={analysisData.pigmentationTone.redness} />
                  <MetricItem label="Dark Circles" value={analysisData.pigmentationTone.darkCircles} />
                </View>
              </View>

              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Eye size={20} color={Colors.dark.primary} />
                  </View>
                  <Text style={styles.categoryTitle}>Clarity</Text>
                </View>
                <View style={styles.metricsGrid}>
                  <MetricItem label="Acne" value={analysisData.clarity.acne} />
                  <MetricItem label="Tear Trough" value={analysisData.clarity.tearTrough} />
                </View>
              </View>

              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Clock size={20} color={Colors.dark.primary} />
                  </View>
                  <Text style={styles.categoryTitle}>Aging & Structure</Text>
                </View>
                <View style={styles.metricsGrid}>
                  <MetricItem label="Wrinkles" value={analysisData.agingStructure.wrinkles} />
                  <MetricItem label="Firmness" value={analysisData.agingStructure.firmness} />
                  <MetricItem label="Eyebags" value={analysisData.agingStructure.eyebags} />
                  <MetricItem label="Upper Eyelid" value={analysisData.agingStructure.droopyUpperEyelid} />
                  <MetricItem label="Lower Eyelid" value={analysisData.agingStructure.droopyLowerEyelid} />
                </View>
              </View>

              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <View style={styles.breakdownIcon}>
                    <Sparkles size={20} color={Colors.dark.secondary} />
                  </View>
                  <Text style={styles.breakdownLabel}>Radiance Score</Text>
                </View>
                <Text style={styles.breakdownValue}>
                  {analysisData.radianceScore}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${analysisData.radianceScore}%`,
                        backgroundColor: Colors.dark.secondary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.breakdownDescription}>
                  Expression and positive energy detected
                  {analysisData.hasRadianceBonus && " (10% bonus applied!)"}
                </Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
              <Pressable
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={[Colors.dark.primary, Colors.dark.primaryDim]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Check size={24} color={Colors.dark.background} />
                  <Text style={styles.saveButtonText}>
                    {isSaving ? "Saving..." : "Save to Journal"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.retakeButton} onPress={() => router.back()}>
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to analyze image</Text>
            <Pressable style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function MetricItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={styles.metricBar}>
        <View
          style={[
            styles.metricBarFill,
            {
              width: `${value}%`,
              backgroundColor: value >= 80 ? Colors.dark.success : value >= 60 ? Colors.dark.primary : Colors.dark.warning,
            },
          ]}
        />
      </View>
    </View>
  );
}

function CircularProgress({ score }: { score: number }) {
  const size = 200;
  const strokeWidth = 16;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [score, progress]);

  return (
    <View style={[styles.circularProgress, { width: size, height: size }]}>
      <View
        style={[
          styles.circularProgressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.dark.surfaceElevated,
          },
        ]}
      />
      <View
        style={[
          styles.circularProgressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.dark.primary,
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            transform: [{ rotate: `-${90 - (score / 100) * 360}deg` }],
          },
        ]}
      />
      <View style={styles.circularProgressInner}>
        <Text style={styles.circularProgressScore}>{score}</Text>
        <Text style={styles.circularProgressLabel}>/100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 20,
    marginBottom: 24,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  scoreCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 24,
  },
  circularProgress: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  circularProgressInner: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circularProgressScore: {
    fontSize: 64,
    fontWeight: "700" as const,
    color: Colors.dark.primary,
  },
  circularProgressLabel: {
    fontSize: 20,
    color: Colors.dark.textSecondary,
  },
  circularProgressRing: {
    position: "absolute",
  },
  scoreInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  bonusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
    marginTop: 20,
  },
  bonusText: {
    fontSize: 14,
    color: Colors.dark.secondary,
    fontWeight: "600" as const,
  },
  scoreLabel: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginBottom: 6,
    textAlign: "center",
  },
  scoreDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  breakdown: {
    gap: 20,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: "500" as const,
  },
  infoValue: {
    fontSize: 18,
    color: Colors.dark.text,
    fontWeight: "700" as const,
  },
  breakdownTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 12,
  },
  categorySection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.dark.text,
  },
  metricsGrid: {
    gap: 12,
  },
  metricItem: {
    gap: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: "500" as const,
  },
  metricValue: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "600" as const,
  },
  metricBar: {
    height: 6,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  metricBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  breakdownItem: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  breakdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.dark.text,
  },
  breakdownValue: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  breakdownDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.dark.background,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  retakeButton: {
    padding: 16,
    alignItems: "center",
  },
  retakeButtonText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontWeight: "500" as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.dark.error,
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    color: Colors.dark.background,
    fontWeight: "600" as const,
  },
});
