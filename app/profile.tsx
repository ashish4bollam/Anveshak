import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Button, Avatar, Card } from "react-native-paper";

export default function ProfileScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("John Doe");
  const [phone, setPhone] = useState("9876543210");
  const [email, setEmail] = useState("johndoe@example.com");
  const [address, setAddress] = useState("123 Street Name");
  const [city, setCity] = useState("New York");
  const [state, setState] = useState("NY");
  const [postalCode, setPostalCode] = useState("10001");
  const [policeId, setPoliceId] = useState("POL123456");
  const [department, setDepartment] = useState("Traffic Control");

  const saveProfile = () => {
    alert(`Profile Saved!\nUsername: ${username}\nPhone: ${phone}`);
    router.push("../dashboard");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Avatar.Icon size={80} icon="account" style={styles.avatar} />
          <Text style={styles.profileName}>{username}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </Card>

        {/* Profile Fields Card */}
        <Card style={styles.formCard}>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput style={styles.input} value={username} onChangeText={setUsername} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={state} onChangeText={setState} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Police ID</Text>
              <TextInput style={styles.input} value={policeId} onChangeText={setPoliceId} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Department</Text>
              <TextInput style={styles.input} value={department} onChangeText={setDepartment} />
            </View>
          </View>
        </Card>

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
  profileCard: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#1C1E2A",
    borderRadius: 12,
    width: "100%",
    marginBottom: 20,
  },
  avatar: {
    backgroundColor: "#4A90E2",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 14,
    color: "#bbbbbb",
  },
  formCard: {
    backgroundColor: "#1C1E2A",
    borderRadius: 12,
    width: "100%",
    padding: 15,
    marginBottom: 20,
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#bbbbbb",
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#262A34",
    color: "#ffffff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A90E2",
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#4A90E2",
    padding: 10,
    width: "100%",
  },
});
