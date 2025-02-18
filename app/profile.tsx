import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Card, Button } from "react-native-paper";

export default function ProfileScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("Raj Singh");
  const [phone, setPhone] = useState("9876543210");
  const [email, setEmail] = useState("raj1234@gmail.com");
  const [address, setAddress] = useState("123 Street Name");
  const [city, setCity] = useState("Raipur");
  const [state, setState] = useState("Chattisgarh");
  const [postalCode, setPostalCode] = useState("10001");
  const [policeId, setPoliceId] = useState("POL123456");
  const [department, setDepartment] = useState("Traffic Control");

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
              <Text style={styles.value}>{username}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Police ID:</Text>
              <Text style={styles.value}>{policeId}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Department:</Text>
              <Text style={styles.value}>{department}</Text>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.formCard}>
          <Text style={styles.categoryTitle}>Contact Information</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Phone Number:</Text>
              <Text style={styles.value}>{phone}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Email Address:</Text>
              <View style={styles.emailContainer}>
                <Text style={styles.value}>{email}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Address Information */}
        <Card style={styles.formCard}>
          <Text style={styles.categoryTitle}>Address Information</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{address}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>City:</Text>
              <Text style={styles.value}>{city}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>State:</Text>
              <Text style={styles.value}>{state}</Text>
            </View>
            <View style={styles.inputGroupRow}>
              <Text style={styles.label}>Postal Code:</Text>
              <Text style={styles.value}>{postalCode}</Text>
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
  emailContainer: {
    marginLeft: 10,
  },
  label: {
    fontSize: 18,
    color: "#bbbbbb",
    fontWeight: "bold",
  },
  value: {
    fontSize: 18,
    color: "#ffffff",
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
});
