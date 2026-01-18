import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Shield } from "lucide-react-native";
import { useState, useEffect } from "react";
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

export default function VerifyResetScreen() {
  const { userId, email } = useLocalSearchParams<{ userId: string; email: string }>();
  const [code, setCode] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const verifyMutation = trpc.auth.verifyResetCode.useMutation({
    onSuccess: (data) => {
      router.push({
        pathname: "/reset-password" as any,
        params: { userId, codeId: data.codeId },
      });
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const resendMutation = trpc.auth.sendResetCode.useMutation({
    onSuccess: () => {
      setCanResend(false);
      setCountdown(30);
      Alert.alert("Success", "A new code has been sent to your email");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleVerify = () => {
    if (!code || code.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "Invalid session");
      return;
    }
    verifyMutation.mutate({ userId, code });
  };

  const handleResend = () => {
    if (!email) {
      Alert.alert("Error", "Invalid session");
      return;
    }
    resendMutation.mutate({ email });
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
              <Shield size={48} color={Colors.dark.primary} />
            </View>
            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to {email}
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor={Colors.dark.textTertiary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <Pressable
              style={[
                styles.button,
                verifyMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              disabled={verifyMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {verifyMutation.isPending ? "Verifying..." : "Verify Code"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.resendButton,
                (!canResend || resendMutation.isPending) && styles.resendButtonDisabled,
              ]}
              onPress={handleResend}
              disabled={!canResend || resendMutation.isPending}
            >
              <Text style={[
                styles.resendText,
                (!canResend || resendMutation.isPending) && styles.resendTextDisabled,
              ]}>
                {resendMutation.isPending
                  ? "Sending..."
                  : canResend
                  ? "Resend Code"
                  : `Resend in ${countdown}s`}
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
    paddingHorizontal: 20,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    color: Colors.dark.text,
    textAlign: "center",
    letterSpacing: 8,
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
  resendButton: {
    padding: 12,
    alignItems: "center",
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  resendTextDisabled: {
    color: Colors.dark.textSecondary,
  },
});
