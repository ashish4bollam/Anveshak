import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ImageBackground } from "react-native";
import { TextInput, Button, Text, Card, Snackbar } from "react-native-paper";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app"; 
import { useRouter } from "expo-router";
import { auth } from "./firebaseConfig"; 

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Function to map Firebase error codes to user-friendly messages
  const getFriendlyErrorMessage = (errorCode: string) => {
    console.log("Firebase Error Code:", errorCode);

    const errorMessages: { [key: string]: string } = {
      "auth/invalid-email": "Invalid email format. Please enter a valid email.",
      "auth/user-disabled": "This account has been disabled. Contact support.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Try again.",
      "auth/invalid-credential": "Incorrect email or password. Please try again.",
      "auth/too-many-requests": "Too many login attempts. Try again later.",
      "auth/network-request-failed": "Network error. Check your internet connection.",
      "auth/internal-error": "Internal error. Please try again later.",
    };

    return errorMessages[errorCode] || `Unexpected error: ${errorCode}. Try again.`;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showSnackbar("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showSnackbar("Please verify your email before logging in.");
        await signOut(auth);
        setLoading(false);
        return;
      }

      showSnackbar("Logged in successfully!");
      router.replace("/dashboard");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      showSnackbar(getFriendlyErrorMessage(firebaseError.code));
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showSnackbar("Please enter your email to reset the password.");
      return;
    }
    setForgotPasswordLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showSnackbar("Password reset email sent!");
    } catch (error) {
      const firebaseError = error as FirebaseError;
      showSnackbar(getFriendlyErrorMessage(firebaseError.code));
    }
    setForgotPasswordLoading(false);
  };

  return (
    <ImageBackground
      source={require('../assets/anveshak-background.png')}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ 
          flex: 1, 
          justifyContent: "center", 
          padding: 20,
          backgroundColor: 'rgba(0,0,0,0.3)' // Adds a slight dark overlay for better readability
        }}
      >
        <Card style={{ 
          padding: 20, 
          borderRadius: 15, 
          elevation: 5, 
          backgroundColor: "rgba(255,255,255,0.9)", // Semi-transparent card
          marginHorizontal: 10
        }}>
          <Text variant="headlineMedium" style={{ marginBottom: 20, textAlign: "center", fontWeight: "bold" }}>
            Login
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={{ marginBottom: 10 }}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            style={{ marginBottom: 10 }}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)} 
                forceTextInputFocus={false}
              />
            }
          />

          <Button 
            mode="contained" 
            onPress={handleLogin} 
            loading={loading} 
            disabled={loading} 
            style={{ borderRadius: 8, marginVertical: 10 }}
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={handleForgotPassword}
            disabled={forgotPasswordLoading}
            style={{ borderRadius: 8, marginBottom: 10 }}
          >
            Forgot Password?
          </Button>

          <Text style={{ textAlign: "center", fontSize: 14 }}>Don't have an account?</Text>
          <Button mode="text" onPress={() => router.push("/signup")} style={{ borderRadius: 8 }}>
            Sign Up
          </Button>
        </Card>

        {/* Snackbar for UI alerts */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={5000}
          action={{
            label: "OK",
            onPress: () => setSnackbarVisible(false),
          }}
          style={{ bottom: 20 }} // Position the snackbar a bit higher from bottom
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}