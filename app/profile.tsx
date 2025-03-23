import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { DocumentData, doc, getDoc, deleteDoc } from "firebase/firestore";
import { Card, Button } from "react-native-paper";
import { db } from "./firebaseConfig";
import { getAuth, onAuthStateChanged, deleteUser, signOut } from "firebase/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleDeleteProfile = async () => {
    if (!userId || !auth.currentUser) return;

    Alert.alert(
      "Delete Profile",
      "Are you sure you want to permanently delete your profile? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete user data from Firestore
              await deleteDoc(doc(db, "users", userId));

              // Delete authentication account
              const auth = getAuth();
              const user = auth.currentUser;

              if (user) {
                await deleteUser(user);
              } else {
                console.error("No authenticated user found.");
              }

              // Sign out and redirect to login screen
              await signOut(auth);
              router.push("../login");
            } catch (error) {
              console.error("Error deleting profile:", error);
              Alert.alert("Error", "Failed to delete profile. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
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

        {/* Buttons */}
        <Button mode="contained" onPress={() => router.push("../edit_profile")} style={styles.button}>
          Edit Profile
        </Button>

        <Button mode="contained" onPress={() => router.push("../login")} style={styles.button}>
          Logout
        </Button>

        <Button mode="contained" onPress={handleDeleteProfile} style={[styles.button, styles.deleteButton]}>
          Delete Profile
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  deleteButton: {
    backgroundColor: "#D32F2F",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#101218",
  },
});
