import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  Animated,
  Linking,
  Platform,
  ScrollView
} from "react-native";
import MapView, { Marker, Circle, Callout } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";

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
  policeID: string;
  username: string;
  workingCondition: string;
}

export default function CameraListScreen() {
  const { latitude, longitude, radius } = useLocalSearchParams();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isListMinimized, setIsListMinimized] = useState(false);
  
  // Animation values
  const listHeight = useRef(new Animated.Value(Dimensions.get('window').height * 0.4)).current;
  const mapHeight = useRef(new Animated.Value(Dimensions.get('window').height * 0.6)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "cctv_cameras"));
      const camerasData: Camera[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Camera));

      const filteredCameras = camerasData.filter((camera) => {
        const distance = getDistanceFromLatLonInKm(
          Number(latitude),
          Number(longitude),
          parseFloat(camera.latitude),
          parseFloat(camera.longitude)
        );
        return distance <= Number(radius);
      });

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

  const getCameraIcon = (camera: Camera) => {
    if (camera.workingCondition === "Working") {
      return require('../assets/working.png');
    } else {
      return require('../assets/notworking.png');
    }
  };

  const toggleListView = () => {
    const listMaxHeight = Dimensions.get('window').height * 0.4;
    const listMinHeight = 70;
    const mapMaxHeight = Dimensions.get('window').height * 0.9;
    const mapMinHeight = Dimensions.get('window').height * 0.6;
    
    setIsListMinimized(!isListMinimized);
    
    Animated.parallel([
      Animated.timing(listHeight, {
        toValue: isListMinimized ? listMaxHeight : listMinHeight,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(mapHeight, {
        toValue: isListMinimized ? mapMinHeight : mapMaxHeight,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(arrowRotation, {
        toValue: isListMinimized ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();
  };

  const openGoogleMaps = (camera: Camera) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${camera.latitude},${camera.longitude}`;
    const label = camera.deviceName;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url as string)
      .catch(() => {
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&destination_place_id=${label}`;
        Linking.openURL(webUrl);
      });
  };

  const arrowRotateStyle = {
    transform: [{
      rotate: arrowRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
      })
    }]
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Cameras</Text>
      </View>

      {/* Map View */}
      <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: Number(latitude),
            longitude: Number(longitude),
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
        >
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
              onPress={() => setSelectedCamera(camera)}
            >
              <Image 
                source={getCameraIcon(camera)} 
                style={{ width: 32, height: 32 }}
              />
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{camera.deviceName}</Text>
                  <Text style={styles.calloutText}>
                    <FontAwesome 
                      name={camera.workingCondition === "Working" ? "check-circle" : "times-circle"} 
                      color={camera.workingCondition === "Working" ? "green" : "red"} 
                      size={14} 
                    /> {camera.workingCondition}
                  </Text>
                  <Text style={styles.calloutText}>📍 {camera.address}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </Animated.View>

      {/* Camera List - Minimizable */}
      <Animated.View style={[styles.listContainer, { height: listHeight }]}>
        {/* Handle to minimize/maximize */}
        <TouchableOpacity 
          style={styles.handleContainer} 
          onPress={toggleListView}
          activeOpacity={0.7}
        >
          <View style={styles.handle} />
          <View style={styles.handleTextContainer}>
            <Text style={styles.listTitle}>
              {cameras.length} Cameras Found
            </Text>
            <Animated.View style={arrowRotateStyle}>
              <MaterialIcons 
                name="keyboard-arrow-up" 
                size={24} 
                color="#007AFF" 
              />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Camera List - Only shown when not minimized */}
        {!isListMinimized && (
          <FlatList
            data={cameras}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.cameraItem}
                onPress={() => setSelectedCamera(item)}
              >
                <Image 
                  source={getCameraIcon(item)} 
                  style={styles.cameraIcon} 
                />
                <View style={styles.cameraInfo}>
                  <Text style={styles.cameraName}>{item.deviceName}</Text>
                  <Text style={styles.cameraAddress}>{item.address}</Text>
                  <Text style={[
                    styles.cameraStatus,
                    { color: item.workingCondition === "Working" ? 'green' : 'red' }
                  ]}>
                    {item.workingCondition}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            )}
          />
        )}
      </Animated.View>

      {/* Camera Details Modal */}
      {selectedCamera && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedCamera}
          onRequestClose={() => setSelectedCamera(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedCamera.deviceName}</Text>
                <TouchableOpacity onPress={() => setSelectedCamera(null)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={20} color="#007AFF" />
                  <Text style={styles.detailText}>{selectedCamera.address}, {selectedCamera.city}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="business" size={20} color="#007AFF" />
                  <Text style={styles.detailText}>{selectedCamera.organization}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="person" size={20} color="#007AFF" />
                  <Text style={styles.detailText}>{selectedCamera.ownerName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="phone" size={20} color="#007AFF" />
                  <Text style={styles.detailText}>{selectedCamera.phoneNumber}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons 
                    name={selectedCamera.workingCondition === "Working" ? "check-circle" : "error"} 
                    size={20} 
                    color={selectedCamera.workingCondition === "Working" ? "green" : "red"} 
                  />
                  <Text style={[
                    styles.detailText,
                    { color: selectedCamera.workingCondition === "Working" ? 'green' : 'red' }
                  ]}>
                    {selectedCamera.workingCondition}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="security" size={20} color="#007AFF" />
                  <Text style={styles.detailText}>Police ID: {selectedCamera.policeID}</Text>
                </View>
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.directionButton}
                onPress={() => openGoogleMaps(selectedCamera)}
              >
                <MaterialIcons name="directions" size={20} color="#fff" />
                <Text style={styles.directionButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapContainer: {
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutText: {
    fontSize: 12,
    marginBottom: 3,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: 20,
  },
  handleContainer: {
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 5,
  },
  handleTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cameraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cameraIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  cameraInfo: {
    flex: 1,
  },
  cameraName: {
    fontWeight: '500',
    marginBottom: 3,
    fontSize: 16,
  },
  cameraAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  cameraStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  directionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  directionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});