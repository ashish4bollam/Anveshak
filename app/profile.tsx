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
import { Card, Button, Divider, IconButton } from "react-native-paper";
import { db } from "./firebaseConfig";
import { getAuth, onAuthStateChanged, deleteUser, signOut } from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons";

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
              await deleteDoc(doc(db, "users", userId));
              const user = auth.currentUser;
              if (user) {
                await deleteUser(user);
              }
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

  const renderInfoItem = (iconName: string, label: string, value?: string) => (
    <>
      <View style={styles.infoRow}>
        <MaterialIcons name={iconName as any} size={24} color="#6C63FF" style={styles.infoIcon} />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value || "N/A"}</Text>
        </View>
      </View>
      <Divider style={styles.divider} />
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>
        
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <MaterialIcons name="account-circle" size={80} color="#6C63FF" />
            <Text style={styles.profileName}>{userData?.username || "User"}</Text>
            <Text style={styles.profileRole}>{userData?.department || "Police Department"}</Text>
          </View>
        </Card>

        {/* Information Sections */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Card style={styles.infoCard}>
            {renderInfoItem("badge", "Police ID", userData?.policeID)}
            {renderInfoItem("work", "Department", userData?.department)}
          </Card>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Card style={styles.infoCard}>
            {renderInfoItem("phone", "Phone", userData?.phone)}
            {renderInfoItem("email", "Email", userData?.email)}
          </Card>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          <Card style={styles.infoCard}>
            {renderInfoItem("location-on", "Address", userData?.address)}
            {renderInfoItem("location-city", "City", userData?.city)}
            {renderInfoItem("map", "State", userData?.state)}
            {renderInfoItem("markunread-mailbox", "Postal Code", userData?.postalCode)}
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Button 
            mode="contained" 
            onPress={() => router.push("../edit_profile")} 
            style={styles.button}
            labelStyle={styles.buttonLabel}
            icon="pencil"
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </Button>

          <Button 
            mode="outlined" 
            onPress={() => {
              signOut(auth);
              router.push("../login");
            }} 
            style={[styles.button, styles.logoutButton]}
            labelStyle={[styles.buttonLabel, styles.logoutButtonLabel]}
            icon="logout"
          >
            <Text style={[styles.buttonText, styles.logoutButtonText]}>Logout</Text>
          </Button>

          <Button 
            mode="contained" 
            onPress={handleDeleteProfile} 
            style={[styles.button, styles.deleteButton]}
            labelStyle={styles.buttonLabel}
            icon="delete"
          >
            <Text style={styles.buttonText}>Delete Account</Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    marginBottom: 24,
    padding: 20,
    elevation: 4,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
  },
  profileRole: {
    fontSize: 16,
    color: "#BBBBBB",
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    paddingLeft: 8,
  },
  infoCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#BBBBBB",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  divider: {
    backgroundColor: "#333333",
    marginHorizontal: -16,
  },
  buttonGroup: {
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
    elevation: 2,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonText: {
    color: "#FFFFFF",
  },
  logoutButton: {
    backgroundColor: "transparent",
    borderColor: "#6C63FF",
    borderWidth: 2,
  },
  logoutButtonText: {
    color: "#6C63FF",
  },
  logoutButtonLabel: {
    color: "#6C63FF",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
});