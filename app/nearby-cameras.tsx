import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Alert,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import MapView, { Circle, Region } from "react-native-maps";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";

export default function SelectLocationScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [radius, setRadius] = useState(1);
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
    setRegion((prev) => ({
      ...prev,
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    }));
  };

  // 🔍 Search Location using OpenStreetMap (Nominatim)
  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Input Error", "Please enter a place name.");
      return;
    }

    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}`;
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
      } else {
        Alert.alert("Location Not Found", "Try a different place name.");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Could not fetch location. Try again later.");
    }
  };

  // 📍 Update Map Location when a location is selected
  const updateLocation = (lat: number, lon: number) => {
    setRegion((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon,
    }));
    setSearchResults([]); // Hide dropdown after selection
  };

  // 🔄 Update Coordinates on Map Drag
  const handleRegionChangeComplete = (newRegion: Region) => {
    if (
      Math.abs(newRegion.latitude - region.latitude) > 0.0001 ||
      Math.abs(newRegion.longitude - region.longitude) > 0.0001
    ) {
      setRegion(newRegion);
      console.log("Location updated:", region.latitude, region.longitude);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Search Bar */}
        <TextInput
          style={styles.input}
          placeholder="Search for a place"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchLocation} // Search when Enter is pressed
        />

        {/* Search Results */}
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id || item.display_name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => updateLocation(parseFloat(item.lat), parseFloat(item.lon))}
              >
                <Text>{item.display_name}</Text>
              </TouchableOpacity>
            )}
            style={styles.resultsContainer}
          />
        )}

          {/* 🔍 Search Location Button */}
          <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
          <Text style={styles.buttonText}>Search Location</Text>
        </TouchableOpacity>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={handleRegionChangeComplete}
          >
            <Circle
              center={{ latitude: region.latitude, longitude: region.longitude }}
              radius={radius * 1000}
              strokeWidth={2}
              strokeColor="rgba(0, 122, 255, 0.5)"
              fillColor="rgba(0, 122, 255, 0.2)"
            />
          </MapView>

          <View style={styles.markerFixed}>
            <Text style={styles.markerText}>📍</Text>
          </View>
        </View>

        {/* Radius Selector */}
        <Text>Radius: {radius} km</Text>
        <Slider
          style={{ width: 200, height: 40 }}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={radius}
          onValueChange={(value) => setRadius(value)}
        />

        {/* Confirm and Navigate */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() =>
            router.push({
              pathname: "/CameraListScreen", // Ensure this matches the actual filename
              params: {
                latitude: region.latitude.toString(),
                longitude: region.longitude.toString(),
                radius: radius.toString(),
              },
            })
            
          }
        >
          <Text style={styles.buttonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  resultsContainer: {
    backgroundColor: "#fff",
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  mapContainer: { flex: 1 },
  map: { width: "100%", height: "100%" },
  markerFixed: { position: "absolute", top: "50%", left: "50%", marginLeft: -15, marginTop: -15 },
  markerText: { fontSize: 30 },
  confirmButton: { backgroundColor: "#28a745", padding: 10, margin: 10, borderRadius: 5, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  searchButton: {
    backgroundColor: "#007bff",
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  

});
