import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Alert,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";

export default function SelectLocationScreen() {
  interface Place {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }

  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 30.968,
    longitude: 76.523,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // 📍 Get Current Location
  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Allow location access to use this feature.");
      return;
    }

    let userLocation = await Location.getCurrentPositionAsync({});
    updateLocation(userLocation.coords.latitude, userLocation.coords.longitude);
  };

  // 🔍 Search for a Place
  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Input Error", "Please enter a place name.");
      return;
    }

    console.log("Searching for:", searchQuery);

    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;
      let response = await fetch(url, {
        headers: {
          "User-Agent": "YourAppName/1.0 (your@email.com)",
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      let data = await response.json();

      if (data.length > 0) {
        setSearchResults(data);
        setDropdownVisible(true);
      } else {
        Alert.alert("Location Not Found", "Try a different place name.");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Could not fetch location. Try again later.");
    }
  };

  // 📍 Update Map Location (Prevent Counter Effect)
  const updateLocation = (lat: number, lon: number) => {
    if (lat !== region.latitude || lon !== region.longitude) {
      console.log("Updating location to:", lat, lon);
      setRegion((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lon,
      }));
      setDropdownVisible(false);
    }
  };

  // 🔄 Update Coordinates on Map Drag (Prevent Unnecessary Updates)
  const handleRegionChangeComplete = (newRegion: Region) => {
    if (
      newRegion.latitude.toFixed(6) !== region.latitude.toFixed(6) ||
      newRegion.longitude.toFixed(6) !== region.longitude.toFixed(6)
    ) {
      setRegion(newRegion);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Search Input */}
      <TextInput
        style={styles.input}
        placeholder="Search for a place (e.g., Ranchi, India)"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
        <Text style={styles.buttonText}>Search Location</Text>
      </TouchableOpacity>

      {/* 📍 Dropdown List */}
      {dropdownVisible && searchResults.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => updateLocation(parseFloat(item.lat), parseFloat(item.lon))}
              >
                <Text>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* 📌 Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          zoomEnabled={true}       // ✅ Allows pinch-to-zoom
          zoomTapEnabled={true}    // ✅ Allows double-tap zooming
          scrollEnabled={true}     // ✅ Enables smooth map scrolling
          pitchEnabled={true}      // ✅ Enables tilt gestures
        />


        {/* 📍 Fixed Marker */}
        <View style={styles.markerFixed}>
          <Text style={styles.markerText}>📍</Text>
        </View>
      </View>

      {/* ✅ Confirm Button */}
      <TouchableOpacity style={styles.confirmButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Confirm Location</Text>
      </TouchableOpacity>

      {/* 📌 Location Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selected Location</Text>
            <Text>🌍 Latitude: {region.latitude.toFixed(6)}</Text>
            <Text>🌍 Longitude: {region.longitude.toFixed(6)}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🌟 STYLES
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  container: { flex: 1 },
  input: { height: 40, borderColor: "#ccc", borderWidth: 1, margin: 15, paddingHorizontal: 10, borderRadius: 8 },
  searchButton: { backgroundColor: "#007AFF", padding: 10, marginHorizontal: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16 },
  dropdown: { backgroundColor: "white", marginHorizontal: 15, borderRadius: 8, maxHeight: 200 },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  mapContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },
  markerFixed: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -15 }, { translateY: -30 }] },
  markerText: { fontSize: 30 },
  confirmButton: { backgroundColor: "green", padding: 15, margin: 15, borderRadius: 8, alignItems: "center" },
  closeButton: { backgroundColor: "red", padding: 10, marginTop: 10, borderRadius: 8, alignItems: "center" },
});
