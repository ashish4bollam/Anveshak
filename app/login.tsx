import React, { useState } from "react";
import { View, Alert } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "./firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Logged in successfully!");
      router.replace("/dashboard");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 20 }}>
        Login
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ marginBottom: 10 }}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 10 }}
      />

      <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading}>
        Login
      </Button>

      <Button mode="text" onPress={handleForgotPassword} style={{ marginTop: 10 }}>
        Forgot Password?
      </Button>

      <Text style={{ marginTop: 20, textAlign: "center" }}>Don't have an account?</Text>
      <Button mode="text" onPress={() => router.push("/signup")}>Sign Up</Button>
    </View>
  );
}