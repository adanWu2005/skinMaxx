import { useRouter } from "expo-router";
import { Sparkles, Eye, EyeOff } from "lucide-react-native";
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

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();


  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      if (data.requiresVerification) {
        router.push({
          pathname: '/verify' as any,
          params: { userId: data.userId, email: data.email },
        });
      }
    },
    onError: (error) => {
      let errorMessage = error.message;
      
      try {
        const parsed = JSON.parse(error.message);
        if (Array.isArray(parsed) && parsed.length > 0) {
          errorMessage = parsed[0].message || error.message;
        }
      } catch {
        errorMessage = error.message;
      }
      
      Alert.alert("Signup Failed", errorMessage);
    },
  });

  const handleSignup = () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    signupMutation.mutate({ name, email, password });
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
              <Sparkles size={48} color={Colors.dark.primary} />
            </View>
            <Text style={styles.title}>Join skinMaxx</Text>
            <Text style={styles.subtitle}>Start your skin journey today</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={Colors.dark.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.dark.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                placeholderTextColor={Colors.dark.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Eye size={20} color={Colors.dark.textSecondary} />
                ) : (
                  <EyeOff size={20} color={Colors.dark.textSecondary} />
                )}
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.button,
                signupMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={signupMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {signupMutation.isPending ? "Creating account..." : "Sign up"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => router.back()}
            >
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkTextBold}>Login</Text>
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
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
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
  linkButton: {
    padding: 8,
    alignItems: "center",
  },
  linkText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  linkTextBold: {
    color: Colors.dark.primary,
    fontWeight: "600" as const,
  },
});
