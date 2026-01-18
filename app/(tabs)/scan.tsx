import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Camera, LogOut, Sparkles, Trash2, Zap } from "lucide-react-native";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This will permanently delete all your data including your scans and cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (error) {
              console.error("Failed to delete account:", error);
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.dark.background, Colors.dark.surface]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.name}</Text>
              <Text style={styles.subtitle}>Ready for your skin analysis?</Text>
            </View>
            <View style={styles.headerButtons}>
              <Pressable style={styles.logoutButton} onPress={logout}>
                <LogOut size={20} color={Colors.dark.textSecondary} />
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Trash2 size={20} color={Colors.dark.error} />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroSection}>
            <View style={styles.iconBubble}>
              <Sparkles size={64} color={Colors.dark.primary} />
            </View>
            <Text style={styles.heroTitle}>AI Skin Analysis</Text>
            <Text style={styles.heroDescription}>
              Get instant feedback on your skin health with our advanced AI technology
            </Text>
          </View>

          <Pressable
            style={styles.scanButton}
            onPress={() => router.push("/camera")}
          >
            <LinearGradient
              colors={[Colors.dark.primary, Colors.dark.primaryDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scanButtonGradient}
            >
              <Camera size={32} color={Colors.dark.background} />
              <Text style={styles.scanButtonText}>Start New Scan</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.features}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Zap size={24} color={Colors.dark.primary} />
              </View>
              <Text style={styles.featureTitle}>Technical Health</Text>
              <Text style={styles.featureDescription}>
                Advanced AI analyzes skin texture, tone, and clarity
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Sparkles size={24} color={Colors.dark.secondary} />
              </View>
              <Text style={styles.featureTitle}>Radiance Bonus</Text>
              <Text style={styles.featureDescription}>
                Smile detection unlocks bonus points for positive energy
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  logoutButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconBubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  scanButton: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.dark.background,
  },
  features: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
});
