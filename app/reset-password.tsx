import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { trpc } from "@/lib/trpc";

export default function ResetPasswordScreen() {
  const { userId, codeId } = useLocalSearchParams<{ userId: string; codeId: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      Alert.alert(
        "Success",
        "Your password has been reset successfully",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!userId || !codeId) {
      Alert.alert("Error", "Invalid session");
      return;
    }

    resetPasswordMutation.mutate({ userId, codeId, newPassword });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.dark.text} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Lock size={48} color={Colors.dark.primary} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor={Colors.dark.textTertiary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <Eye size={20} color={Colors.dark.textSecondary} />
                ) : (
                  <EyeOff size={20} color={Colors.dark.textSecondary} />
                )}
              </Pressable>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.dark.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <Eye size={20} color={Colors.dark.textSecondary} />
                ) : (
                  <EyeOff size={20} color={Colors.dark.textSecondary} />
                )}
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.button,
                resetPasswordMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  backButton: {
    position: "absolute" as const,
    top: 20,
    left: 24,
    padding: 8,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  passwordContainer: {
    position: "relative" as const,
  },
  eyeIcon: {
    position: "absolute" as const,
    right: 16,
    top: 16,
    padding: 4,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
  },
  button: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
