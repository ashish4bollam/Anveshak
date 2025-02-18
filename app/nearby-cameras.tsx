import React, { useState } from "react";
import { 
  View, StyleSheet, TextInput, Button, Alert, ActivityIndicator, Text, TouchableOpacity, Modal 
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import * as Location from "expo-location";

type Camera = {
  id: string;
  latitude: number;
  longitude: number;
  deviceName: string;
  address: string;
  ownerName: string;
};

export default function SearchNearbyCameras() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("");
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const haversineDistance = (
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number => {
    const toRad = (angle: number) => (Math.PI * angle) / 180;
    
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };
  

  const fetchCameras = async (currentCoords: Location.LocationObjectCoords, searchRadius: number) => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "cctv_cameras"));
      const cameraList: Camera[] = [];
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.latitude && data.longitude) {
          const latitude = parseFloat(data.latitude);
          const longitude = parseFloat(data.longitude);
          const distance = haversineDistance(currentCoords, { latitude, longitude });
  
          if (distance <= searchRadius) {
            cameraList.push({
              id: doc.id,
              latitude,
              longitude,
              deviceName: data.deviceName || "Unknown Device",
              address: data.address || "No Address Available",
              ownerName: data.ownerName || "Unknown Owner",
            });
          }
        }
      });
  
      setCameras(cameraList);
    } catch (error) {
      console.error("Error fetching cameras:", error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSearch = () => {
    if (!latitude || !longitude || !radius) {
      Alert.alert("Input Error", "Please enter latitude, longitude, and radius.");
      return;
    }

    const searchCoords: Location.LocationObjectCoords = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      altitude: 0,
      accuracy: 0,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0,
    };
    const searchRadius = parseFloat(radius);

    setLocation(searchCoords);
    fetchCameras(searchCoords, searchRadius);
    setShowMap(true);
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Allow location access to use this feature.");
      return;
    }

    const userLocation = await Location.getCurrentPositionAsync({});
    setLatitude(userLocation.coords.latitude.toString());
    setLongitude(userLocation.coords.longitude.toString());
  };

  return (
    <View style={styles.container}>
      {!showMap ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter Latitude"
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Longitude"
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Radius (km)"
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
          />
          
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <Text style={styles.locationButtonText}>Use Current Location</Text>
          </TouchableOpacity>

          <Button title="Search Cameras" onPress={handleSearch} />
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {cameras.map((camera) => (
            <Marker
              key={camera.id}
              coordinate={{ latitude: camera.latitude, longitude: camera.longitude }}
              pinColor="red"
              onPress={() => {
                setSelectedCamera(camera);
                setModalVisible(true);
              }}
            />
          ))}
        </MapView>
      )}

      {/* Camera Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedCamera && (
              <>
                <Text style={styles.modalTitle}>{selectedCamera.deviceName}</Text>
                <Text>📍 {selectedCamera.address}</Text>
                <Text>👤 Owner: {selectedCamera.ownerName}</Text>
                <Text>🌍 Lat: {selectedCamera.latitude.toFixed(6)}</Text>
                <Text>🌍 Lng: {selectedCamera.longitude.toFixed(6)}</Text>
                <Button title="Close" onPress={() => setModalVisible(false)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  locationButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  locationButtonText: {
    color: "#333",
    fontSize: 14,
  },
  map: {
    flex: 1,
  },
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
  },
});

