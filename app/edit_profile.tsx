import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "react-native-paper";
import { db } from "./firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface UserData {
  policeID: string;
  department: string;
  phone: string; // We'll strictly enforce 10 digits here
  address: string;
  city: string;
  state: string;
  postalCode: string;
  [key: string]: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [userData, setUserData] = useState<UserData>({
    policeID: "",
    department: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        console.log("No user is logged in.");
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
          const data = userSnap.data() as UserData;
          const { policeID, department, phone, address, city, state, postalCode } = data;
          setUserData({ policeID, department, phone, address, city, state, postalCode });
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
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, userData);
      Alert.alert("Success", "Profile updated successfully!");
      router.push("../profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

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
        {/* For each field in userData, create a labeled input */}
        {Object.keys(userData).map((key) => {
          const value = (userData as any)[key];

          // Custom logic for phone field
          if (key === "phone") {
            return (
              <View key={key} style={styles.inputContainer}>
                <Text style={styles.label}>Phone:</Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  keyboardType="numeric"
                  // Limit user to digits only and max 10 characters
                  onChangeText={(text) => {
                    // Remove non-numeric characters
                    const numericText = text.replace(/\D/g, "");
                    // Slice to 10 characters
                    const limitedText = numericText.slice(0, 10);
                    setUserData((prev) => ({ ...prev, phone: limitedText }));
                  }}
                />
              </View>
            );
          }

          // For all other fields
          return (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.label}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
              </Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={(text) =>
                  setUserData((prev) => ({ ...prev, [key]: text }))
                }
              />
            </View>
          );
        })}

        <Button mode="contained" onPress={handleSave} style={styles.button}>
          Save Changes
        </Button>
        <Button mode="outlined" onPress={() => router.back()} style={styles.button}>
          Cancel
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
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#bbbbbb",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 15,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#101218",
  },
});
