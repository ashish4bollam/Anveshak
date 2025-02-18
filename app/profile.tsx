import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { DocumentData } from "firebase/firestore";
import { Card, Button } from "react-native-paper";
import { db } from "./firebaseConfig"; // Import Firestore database
import { doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);

useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setUserId(user.uid); // Set userId dynamically
    } else {
      console.log("No user is logged in.");
      setUserId(null);
    }
  });

  return () => unsubscribe(); // Cleanup function
}, []);

useEffect(() => {
  const fetchUserData = async () => {
    if (!userId) return; // Ensure userId is available before fetching

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log("User data fetched:", userSnap.data());
        setUserData(userSnap.data());
      } else {
        console.log("No such user found in Firestore!");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchUserData();
}, [userId]); // Re-run when userId changes



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Personal Information */}
        <Card style={styles.formCard}>
          <Text style={styles.categoryTitle}>Personal Information</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>{userData?.username || "N/A"}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Police ID:</Text>
              <Text style={styles.value}>{userData?.policeID || "N/A"}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Department:</Text>
              <Text style={styles.value}>{userData?.department || "N/A"}</Text>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.formCard}>
          <Text style={styles.categoryTitle}>Contact Information</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Phone Number:</Text>
              <Text style={styles.value}>{userData?.phone || "N/A"}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Email Address:</Text>
              <Text style={styles.value}>{userData?.email || "N/A"}</Text>
            </View>
          </View>
        </Card>

        {/* Address Information */}
        <Card style={styles.formCard}>
          <Text style={styles.categoryTitle}>Address Information</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{userData?.address || "N/A"}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>City:</Text>
              <Text style={styles.value}>{userData?.city || "N/A"}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>State:</Text>
              <Text style={styles.value}>{userData?.state || "N/A"}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Postal Code:</Text>
              <Text style={styles.value}>{userData?.postalCode || "N/A"}</Text>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <Button mode="contained" onPress={() => router.push("../login")} style={styles.button}>
          Logout
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#101218",
    padding: 20,
    alignItems: "center",
  },
  formCard: {
    backgroundColor: "#1C1E2A",
    borderRadius: 12,
    width: "100%",
    padding: 20,
    marginBottom: 20,
  },
  formContainer: {
    width: "100%",
  },
  inputGroupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    color: "#bbbbbb",
    fontWeight: "bold",
    flex: 160,
    
  },
  value: {
    fontSize: 18,
    color: "#ffffff",
    flex: 190,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#4A90E2",
    padding: 12,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#101218",
  },
});

