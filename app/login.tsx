import React, { useState } from "react";
import { View, Alert } from "react-native";
import { TextInput, Button, Text, Card } from "react-native-paper";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "./firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if(!email && !password) router.replace("/dashboard");
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        Alert.alert("Email Not Verified", "Please verify your email before logging in.");
        await signOut(auth);
        setLoading(false);
        return;
      }

      Alert.alert("Success", "Logged in successfully!");
      router.replace("/dashboard");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
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
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#F4F6F8" }}>
      <Card style={{ padding: 20, borderRadius: 15, elevation: 5, backgroundColor: "#fff" }}>
        <Text variant="headlineMedium" style={{ marginBottom: 20, textAlign: "center", fontWeight: "bold" }}>
          Login
        </Text>

        <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={{ marginBottom: 10 }} />
        <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" style={{ marginBottom: 10 }} />

        <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading} style={{ borderRadius: 8, marginVertical: 10 }}>
          Login
        </Button>

        <Button mode="text" onPress={handleForgotPassword} style={{ borderRadius: 8, marginBottom: 10 }}>
          Forgot Password?
        </Button>

        <Text style={{ textAlign: "center", fontSize: 14 }}>Don't have an account?</Text>
        <Button mode="text" onPress={() => router.push("/signup")} style={{ borderRadius: 8 }}>Sign Up</Button>
      </Card>
    </View>
  );
}