import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import { TextInput, Button, Text, Card, Divider } from "react-native-paper";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { auth, db } from "./firebaseConfig";

const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTaKEggp_5qZDxpP6Pw-9k0XHDF6jYxwzNnfqloB7_rF6EyNdac-SkFx8E7mtrRVthqQdxMRFtDDW-l/pub?output=csv";

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
  const [allowedEmails, setAllowedEmails] = useState(new Set());

  useEffect(() => {
    const fetchAllowedEmails = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        const csvText = await response.text();
        const rows = csvText.split("\n").map(row => row.trim());

        const emails = new Set();
        for (let i = 1; i < rows.length; i++) { // Skip header row
          const columns = rows[i].split(","); 
          if (columns.length >= 3) {
            emails.add(columns[2].trim().toLowerCase()); // Extract email from third column
          }
        }
        setAllowedEmails(emails);
      } catch (error) {
        console.error("Error fetching CSV:", error);
        Alert.alert("Error", "Failed to load allowed emails.");
      }
    };
    fetchAllowedEmails();
  }, []);

  const handleSignup = async () => {
    if (!allowedEmails.has(email.toLowerCase())) {
      Alert.alert("Error", "Your email is not authorized for signup.");
      return;
    }

    if (!username || !email || !password || !policeID || !phone) {
      Alert.alert("Error", "Please fill in all mandatory fields.");
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
        address: address || "",
        city: city || "",
        state: state || "",
        postalCode: postalCode || "",
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
        
        <TextInput label="Username *" value={username} onChangeText={setUsername} style={{ marginBottom: 10 }} />
        <TextInput label="Police ID *" value={policeID} onChangeText={setPoliceID} style={{ marginBottom: 10 }} />
        <TextInput label="Department *" value={department} onChangeText={setDepartment} style={{ marginBottom: 10 }} />
        <Divider style={{ marginVertical: 10 }} />

        <TextInput label="Phone Number *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ marginBottom: 10 }} />
        <TextInput label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={{ marginBottom: 10 }} />
        <TextInput label="Password *" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 20 }} />
        <Divider style={{ marginVertical: 10 }} />

        <TextInput label="Address" value={address} onChangeText={setAddress} style={{ marginBottom: 10 }} />
        <TextInput label="City" value={city} onChangeText={setCity} style={{ marginBottom: 10 }} />
        <TextInput label="State" value={state} onChangeText={setState} style={{ marginBottom: 10 }} />
        <TextInput label="Postal Code" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" style={{ marginBottom: 20 }} />
        <Divider style={{ marginVertical: 10 }} />

        <Button mode="contained" onPress={handleSignup} loading={loading} disabled={loading} style={{ borderRadius: 5, paddingVertical: 5 }}>
          Sign Up
        </Button>

        <Text style={{ marginTop: 20, textAlign: "center" }}>Already have an account?</Text>
        <Button mode="text" onPress={() => router.push("/login")} style={{ borderRadius: 5 }}>Login</Button>
      </Card>
    </ScrollView>
  );
}