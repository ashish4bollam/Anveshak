import React, { useState } from "react";
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator 
} from "react-native";
import { Button, Avatar } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function AddCamera() {
  const router = useRouter();

  const [ownerName, setOwnerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);

  // 📍 Get Current Location
  const getLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access location was denied");
      setLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude.toString());
    setLongitude(location.coords.longitude.toString());

    let geocode = await Location.reverseGeocodeAsync(location.coords);
    if (geocode.length > 0) {
      setAddress(`${geocode[0].name}, ${geocode[0].city}`);
    }

    setLoading(false);
  };

  // ✅ Validate Form
  const validateForm = () => {
    if (!city || !organization || !ownerName || !phoneNumber || !deviceName || !deviceType || !latitude || !longitude) {
      Alert.alert("Missing Fields", "Please fill in all fields before submitting.");
      return false;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      Alert.alert("Invalid Phone Number", "Phone number must be exactly 10 digits.");
      return false;
    }
    return true;
  };

  // 🚀 Submit Data to Firestore
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      await addDoc(collection(db, "cctv_cameras"), {
        city,
        organization,
        ownerName,
        phoneNumber,
        deviceName,
        deviceType,
        latitude,
        longitude,
        address,
      });

      Alert.alert("Success", "Camera details submitted successfully!");
      router.push("/dashboard");
    } catch (error) {
      Alert.alert("Error", "Failed to submit data.");
      console.error("Firestore Error:", error);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add CCTV Camera</Text>

      <TextInput style={styles.input} placeholder="City" placeholderTextColor="#aaa" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Organization" placeholderTextColor="#aaa" value={organization} onChangeText={setOrganization} />
      <TextInput style={styles.input} placeholder="CCTV Owner Name" placeholderTextColor="#aaa" value={ownerName} onChangeText={setOwnerName} />
      <TextInput style={styles.input} placeholder="CCTV Owner Phone Number" placeholderTextColor="#aaa" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

      <TextInput style={styles.input} placeholder="CCTV Device Name" placeholderTextColor="#aaa" value={deviceName} onChangeText={setDeviceName} />
      <TextInput style={styles.input} placeholder="CCTV Device Type" placeholderTextColor="#aaa" value={deviceType} onChangeText={setDeviceType} />

      {/* 📍 GPS Coordinates */}
      <View style={styles.coordinatesContainer}>
        <TextInput style={styles.inputSmall} placeholder="Latitude" placeholderTextColor="#aaa" value={latitude} editable={false} />
        <TextInput style={styles.inputSmall} placeholder="Longitude" placeholderTextColor="#aaa" value={longitude} editable={false} />
        <TouchableOpacity onPress={getLocation} style={styles.gpsButton}>
          <Avatar.Icon size={40} icon="crosshairs-gps" style={styles.icon} />
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Current Location" placeholderTextColor="#aaa" value={address} editable={false} />

      {loading && <ActivityIndicator size="large" color="#4A90E2" />}

      <Button mode="contained" style={styles.submitButton} onPress={handleSubmit}>
        Submit
      </Button>
    </View>
  );
}

// 🌟 Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 20, textAlign: "center" },
  input: { height: 50, backgroundColor: "#fff", color: "#000", borderRadius: 8, paddingHorizontal: 10, fontSize: 16, marginBottom: 12, borderColor: "#ddd", borderWidth: 1 },
  coordinatesContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  inputSmall: { flex: 1, height: 50, backgroundColor: "#fff", color: "#000", borderRadius: 8, paddingHorizontal: 10, fontSize: 16, marginRight: 10, borderColor: "#ddd", borderWidth: 1 },
  gpsButton: { padding: 5 },
  submitButton: { backgroundColor: "#007bff", marginTop: 10, paddingVertical: 8 },
  icon: { backgroundColor: "#e9ecef" },
});

