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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Button, IconButton } from "react-native-paper";
import { db } from "./firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface UserData {
  policeID: string;
  department: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  [key: string]: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, userData);
      Alert.alert("Success", "Profile updated successfully!");
      router.push("../profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="#FFFFFF"
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 48 }} />
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {Object.keys(userData).map((key) => {
              const value = (userData as any)[key];
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

              if (key === "phone") {
                return (
                  <View key={key} style={styles.inputContainer}>
                    <Text style={styles.label}>{label}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={value}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        placeholderTextColor="#888"
                        keyboardType="phone-pad"
                        onChangeText={(text) => {
                          const numericText = text.replace(/\D/g, "");
                          const limitedText = numericText.slice(0, 10);
                          setUserData((prev) => ({ ...prev, phone: limitedText }));
                        }}
                      />
                    </View>
                  </View>
                );
              }

              return (
                <View key={key} style={styles.inputContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={value}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      placeholderTextColor="#888"
                      onChangeText={(text) =>
                        setUserData((prev) => ({ ...prev, [key]: text }))
                      }
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              labelStyle={styles.buttonLabel}
              loading={isSubmitting}
              disabled={isSubmitting}
              icon="content-save"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.cancelButton}
              labelStyle={[styles.buttonLabel, styles.cancelButtonLabel]}
              icon="close"
            >
              Cancel
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 16,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    flex: 1,
  },
  formContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#BBBBBB",
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 10,
  },
  buttonGroup: {
    marginTop: 8,
    marginBottom: 32,
  },
  saveButton: {
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: "#6C63FF",
  },
  cancelButton: {
    borderRadius: 10,
    paddingVertical: 8,
    borderColor: "#6C63FF",
    borderWidth: 2,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 4,
  },
  cancelButtonLabel: {
    color: "#6C63FF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
});