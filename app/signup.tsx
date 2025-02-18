import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { TextInput, Button, Text, Card, Divider } from "react-native-paper";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { auth, db } from "./firebaseConfig";

export default function SignupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [policeID, setPoliceID] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password || !policeID || !phone || !address || !city || !state || !postalCode) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      Alert.alert("Verify Your Email", "A verification email has been sent. Please verify your email before logging in.");
      await signOut(auth);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        policeID,
        department,
        phone,
        email,
        address,
        city,
        state,
        postalCode,
        verified: false,
        createdAt: new Date().toISOString(),
      });

      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, backgroundColor: "#f4f4f4" }}>
      <Card style={{ padding: 20, borderRadius: 10 }}>
        <Text variant="headlineMedium" style={{ marginBottom: 20, textAlign: "center" }}>Signup</Text>

        {/* Personal Information */}
        <Text variant="titleMedium" style={{ marginBottom: 10 }}>Personal Information</Text>
        <TextInput label="Username" value={username} onChangeText={setUsername} style={{ marginBottom: 10 }} />
        <TextInput label="Police ID" value={policeID} onChangeText={setPoliceID} style={{ marginBottom: 10 }} />
        <TextInput label="Department" value={department} onChangeText={setDepartment} style={{ marginBottom: 10 }} />
        <Divider style={{ marginVertical: 10 }} />

        {/* Contact Information */}
        <Text variant="titleMedium" style={{ marginBottom: 10 }}>Contact Information</Text>
        <TextInput label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ marginBottom: 10 }} />
        <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={{ marginBottom: 10 }} />
        <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 20 }} />
        <Divider style={{ marginVertical: 10 }} />

        {/* Address Information */}
        <Text variant="titleMedium" style={{ marginBottom: 10 }}>Address Information</Text>
        <TextInput label="Address" value={address} onChangeText={setAddress} style={{ marginBottom: 10 }} />
        <TextInput label="City" value={city} onChangeText={setCity} style={{ marginBottom: 10 }} />
        <TextInput label="State" value={state} onChangeText={setState} style={{ marginBottom: 10 }} />
        <TextInput label="Postal Code" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" style={{ marginBottom: 20 }} />
        <Divider style={{ marginVertical: 10 }} />

        {/* Signup Button */}
        <Button mode="contained" onPress={handleSignup} loading={loading} disabled={loading} style={{ borderRadius: 5, paddingVertical: 5 }}>
          Sign Up
        </Button>

        {/* Login Redirection */}
        <Text style={{ marginTop: 20, textAlign: "center" }}>Already have an account?</Text>
        <Button mode="text" onPress={() => router.push("/login")} style={{ borderRadius: 5 }}>Login</Button>
      </Card>
    </ScrollView>
  );
}
