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
import { 
  doc, 
  getDoc, 
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  User,
} from "firebase/auth";

interface UserData {
  policeID: string;
  department: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  emailVerified: boolean;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    policeID: "",
    department: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    emailVerified: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserData(user.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData({
          policeID: data.policeID || "",
          department: data.department || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          postalCode: data.postalCode || "",
          emailVerified: userSnap.data().emailVerified || false,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    if (!validatePhoneNumber(userData.phone)) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        policeID: userData.policeID,
        department: userData.department,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        postalCode: userData.postalCode,
      });

      Alert.alert("Success", "Profile updated successfully!");
      router.push("/profile");
    } catch (error: any) {
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
          <View style={styles.header}>
           
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Police ID</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={userData.policeID}
                  placeholder="Enter police ID"
                  placeholderTextColor="#888"
                  onChangeText={(text) =>
                    setUserData({ ...userData, policeID: text })
                  }
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Department</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={userData.department}
                  placeholder="Enter department"
                  placeholderTextColor="#888"
                  onChangeText={(text) =>
                    setUserData({ ...userData, department: text })
                  }
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={userData.phone}
                  placeholder="Enter phone number"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                  onChangeText={(text) => {
                    const numericText = text.replace(/\D/g, "");
                    setUserData({ ...userData, phone: numericText });
                  }}
                  maxLength={10}
                />
              </View>
              {!validatePhoneNumber(userData.phone) && userData.phone.length > 0 && (
                <Text style={styles.errorText}>Must be 10 digits</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.emailContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { color: '#BBBBBB' }]}
                    value={currentUser?.email || ""}
                    editable={false}
                  />
                </View>
               
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={userData.address}
                  placeholder="Enter address"
                  placeholderTextColor="#888"
                  onChangeText={(text) =>
                    setUserData({ ...userData, address: text })
                  }
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={userData.city}
                  placeholder="Enter city"
                  placeholderTextColor="#888"
                  onChangeText={(text) =>
                    setUserData({ ...userData, city: text })
                  }
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>State</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={userData.state}
                  placeholder="Enter state"
                  placeholderTextColor="#888"
                  onChangeText={(text) =>
                    setUserData({ ...userData, state: text })
                  }
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Postal Code</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={userData.postalCode}
                  placeholder="Enter postal code"
                  placeholderTextColor="#888"
                  keyboardType="number-pad"
                  onChangeText={(text) =>
                    setUserData({ ...userData, postalCode: text })
                  }
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              labelStyle={styles.buttonLabel}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Save Changes
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
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  formContainer: {
    width: "100%",
    marginBottom: 24,
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
    backgroundColor: "#6C63FF",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginLeft: 10,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  unverifiedBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginLeft: 10,
  },
  unverifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});