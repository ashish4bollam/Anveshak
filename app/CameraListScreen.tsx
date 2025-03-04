import React, { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import MapView, { Marker, Callout, Circle } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Import Firebase

interface Camera {
    id: string;
    address: string;
    city: string;
    deviceName: string;
    deviceType: string;
    latitude: string;
    longitude: string;
    organization: string;
    ownerName: string;
    phoneNumber: string;
    policeId: string;
    username: string;
    workingCondition: string;
}

export default function CameraListScreen() {
    const { latitude, longitude, radius } = useLocalSearchParams();
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);


    useEffect(() => {
        fetchCameras();
    }, []);

    const fetchCameras = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "cctv_cameras"));
            const camerasData: Camera[] = querySnapshot.docs.map((doc) => {
                const camera = {
                    id: doc.id,
                    ...doc.data(),
                } as Camera;
                //console.log("Fetched Camera:", camera);  // Debug log
                return camera;
            });

            const filteredCameras = camerasData.filter((camera) => {
                const distance = getDistanceFromLatLonInKm(
                    Number(latitude),
                    Number(longitude),
                    parseFloat(camera.latitude),
                    parseFloat(camera.longitude)
                );
                return distance <= Number(radius);
            });

            // console.log("Filtered Cameras:", filteredCameras); // Debug log
            setCameras(filteredCameras);
        } catch (error) {
            console.error("Error fetching cameras:", error);
            Alert.alert("Error", "Could not load cameras.");
        }
    };


    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // const getZoomLevel = (latitudeDelta) => {
    //     const zoomLevel = Math.log2(360 / latitudeDelta);
    //     console.log("Current Zoom Level:", latitudeDelta);
    //     return zoomLevel;
    //   };
      

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cameras in Selected Region</Text>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    latitudeDelta: 0.03,
                    longitudeDelta: 0.03,
                }
            }
            //onRegionChangeComplete={(region) => getZoomLevel(region.latitudeDelta)}
            >
                {/* Circle to indicate selected radius */}
                <Circle
                    center={{ latitude: Number(latitude), longitude: Number(longitude) }}
                    radius={Number(radius) * 1000}
                    strokeWidth={2}
                    strokeColor="rgba(0, 122, 255, 0.5)"
                    fillColor="rgba(0, 122, 255, 0.2)"
                />

                {cameras.map((camera) => (
                    <Marker
                        key={camera.id}
                        coordinate={{
                            latitude: parseFloat(camera.latitude),
                            longitude: parseFloat(camera.longitude),
                        }}
                        title={camera.deviceName}
                        onPress={() => {
                            console.log(`Marker Pressed: ${camera.deviceName}`);
                            setSelectedCamera(camera); // Update selected camera
                        }}
                    />
                ))}

            </MapView>
            {selectedCamera && (
                <View style={styles.detailsContainer}>
                    <Text style={styles.detailsTitle}>{selectedCamera.deviceName}</Text>
                    <Text style={styles.detailsText}>📍 {selectedCamera.address}</Text>
                    <Text style={styles.detailsText}>🏢 {selectedCamera.organization}</Text>
                    <Text style={styles.detailsText}>👤 Owner: {selectedCamera.ownerName}</Text>
                    <Text style={styles.detailsText}>📞 {selectedCamera.phoneNumber}</Text>
                    <Text style={styles.detailsText}>⚙️ Condition: {selectedCamera.workingCondition}</Text>
                    <Text style={styles.detailsText}>🚔 Police ID: {selectedCamera.policeId}</Text>
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { fontSize: 18, fontWeight: "bold", textAlign: "center", margin: 10 },
    map: { width: "100%", height: "100%" },
    calloutContainer: {
        width: 220,
        padding: 10,
        backgroundColor: "white",
        borderRadius: 8,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,  // Adds shadow on Android
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: "#333",
    },
    calloutText: {
        fontSize: 14,
        marginBottom: 3,
        color: "#555",
    },
    detailsContainer: {
        position: "absolute",
        bottom: 10,
        left: 10,
        right: 10,
        backgroundColor: "white",
        padding: 10,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      },
      detailsTitle: {
        fontSize: 16,
        fontWeight: "bold",
      },
      detailsText: {
        fontSize: 14,
      },
      
});
