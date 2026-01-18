import { useLocalSearchParams } from "expo-router";
import { Mail } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

export default function VerifyScreen() {
  const { userId, email } = useLocalSearchParams<{ userId: string; email: string }>();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const { login } = useAuth();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const verifyMutation = trpc.auth.verifyCode.useMutation({
    onSuccess: (data) => {
      login(data.user, data.token);
    },
    onError: (error) => {
      Alert.alert("Verification Failed", error.message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = trpc.auth.resendCode.useMutation({
    onSuccess: () => {
      setCanResend(false);
      setCountdown(30);
      Alert.alert("Success", "A new code has been sent to your email");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      
      if (newCode.every((digit) => digit !== "")) {
        const fullCode = newCode.join("");
        verifyMutation.mutate({ userId: userId!, code: fullCode });
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((digit) => digit !== "")) {
      const fullCode = newCode.join("");
      verifyMutation.mutate({ userId: userId!, code: fullCode });
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (canResend && userId) {
      resendMutation.mutate({ userId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Mail size={48} color={Colors.dark.primary} />
            </View>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{"\n"}
              <Text style={styles.email}>{email}</Text>
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn&apos;t receive the code?
            </Text>
            {canResend ? (
              <Pressable
                onPress={handleResend}
                disabled={resendMutation.isPending}
              >
                <Text style={styles.resendButton}>
                  {resendMutation.isPending ? "Sending..." : "Resend Code"}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.countdownText}>
                Resend in {countdown}s
              </Text>
            )}
          </View>

          {verifyMutation.isPending && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Verifying...</Text>
            </View>
          )}
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
    fontSize: 28,
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
  email: {
    color: Colors.dark.primary,
    fontWeight: "600" as const,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: Colors.dark.surface,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.dark.text,
    textAlign: "center",
  },
  codeInputFilled: {
    borderColor: Colors.dark.primary,
  },
  resendContainer: {
    alignItems: "center",
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  resendButton: {
    fontSize: 16,
    color: Colors.dark.primary,
    fontWeight: "600" as const,
  },
  countdownText: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.primary,
    fontWeight: "600" as const,
  },
});
