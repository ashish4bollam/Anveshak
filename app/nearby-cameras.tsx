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
  Image,
  Modal,
  ScrollView,
  Switch,
  Platform,
  Linking
} from "react-native";
import MapView, { Circle, Region, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";

export default function SelectLocationScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [radius, setRadius] = useState(1);
  const [region, setRegion] = useState<Region>({
    latitude: 30.968,
    longitude: 76.523,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    working: true,
    notWorking: true,
    dome: true,
    bullet: true,
    cmount: true,
    ptz: true,
    thermal: false,
    anpr: false,
    other: true
  });
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Allow location access to use this feature.");
      return;
    }
    
    try {
      let userLocation = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      Alert.alert("Error", "Could not get your current location.");
    }
  };

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
          "User-Agent": "PoliceCCTVApp/1.0",
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

  const updateLocation = (lat: number, lon: number) => {
    setRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setSearchResults([]);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Camera Location</Text>
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <MaterialIcons name="filter-list" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search for a place..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchLocation}
          />
          <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <FontAwesome name="location-arrow" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => updateLocation(parseFloat(item.lat), parseFloat(item.lon))}
                >
                  <Text style={styles.resultText}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation={true}
            showsMyLocationButton={false}
            minZoomLevel={14}
          >
            <Circle
              center={{ latitude: region.latitude, longitude: region.longitude }}
              radius={radius * 1000}
              strokeWidth={2}
              strokeColor="rgba(0, 122, 255, 0.5)"
              fillColor="rgba(0, 122, 255, 0.2)"
            />
            <Marker
              coordinate={{ latitude: region.latitude, longitude: region.longitude }}
            >
             
                <Image 
                  source={require('../assets/working.png')} 
                  style={{ width: 35, height: 35 }}
                />
              
            </Marker>
          </MapView>
        </View>

        {/* Radius Selector */}
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusText}>Search Radius: {radius} km</Text>
          <Slider
            style={{ width: '80%' }}
            minimumValue={0.5}
            maximumValue={5}
            step={0.5}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#D3D3D3"
            thumbTintColor="#007AFF"
          />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => router.push({
            pathname: "/CameraListScreen",
            params: {
              latitude: region.latitude.toString(),
              longitude: region.longitude.toString(),
              radius: radius.toString(),
              filters: JSON.stringify(filters)
            }
          })}
        >
          <Text style={styles.buttonText}>Find Cameras</Text>
          <MaterialIcons name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Enhanced Filters Modal */}
        <Modal
  visible={showFilters}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowFilters(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Camera Filters</Text>
        <TouchableOpacity onPress={() => setShowFilters(false)}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.filterOptions}>
        {/* Working Status */}
        <Text style={styles.filterSectionTitle}>Working Status</Text>
        <View style={styles.filterItem}>
          <Switch
            value={filters.working}
            onValueChange={() => setFilters({...filters, working: !filters.working})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.working ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>Working Cameras</Text>
        </View>
        <View style={styles.filterItem}>
          <Switch
            value={filters.notWorking}
            onValueChange={() => setFilters({...filters, notWorking: !filters.notWorking})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.notWorking ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>Non-Working Cameras</Text>
        </View>
        
        {/* Camera Types */}
        <Text style={styles.filterSectionTitle}>Camera Types</Text>
        <View style={styles.filterItem}>
          <Switch
            value={filters.dome}
            onValueChange={() => setFilters({...filters, dome: !filters.dome})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.dome ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>Dome Cameras</Text>
        </View>
        <View style={styles.filterItem}>
          <Switch
            value={filters.bullet}
            onValueChange={() => setFilters({...filters, bullet: !filters.bullet})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.bullet ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>Bullet Cameras</Text>
        </View>
        <View style={styles.filterItem}>
          <Switch
            value={filters.cmount}
            onValueChange={() => setFilters({...filters, cmount: !filters.cmount})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.cmount ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>C-Mount Cameras</Text>
        </View>
        <View style={styles.filterItem}>
          <Switch
            value={filters.ptz}
            onValueChange={() => setFilters({...filters, ptz: !filters.ptz})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.ptz ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>PTZ Cameras</Text>
        </View>
        <View style={styles.filterItem}>
          <Switch
            value={filters.thermal}
            onValueChange={() => setFilters({...filters, thermal: !filters.thermal})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.thermal ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>Thermal Cameras</Text>
        </View>
        <View style={styles.filterItem}>
          <Switch
            value={filters.anpr}
            onValueChange={() => setFilters({...filters, anpr: !filters.anpr})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.anpr ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>ANPR Cameras</Text>
        </View>
        <View style={styles.filterItem}>
          <Switch
            value={filters.other}
            onValueChange={() => setFilters({...filters, other: !filters.other})}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={filters.other ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.filterLabel}>Other Types</Text>
        </View>
      </ScrollView>
      
      <View style={styles.filterButtons}>
        <TouchableOpacity 
          style={[styles.filterActionButton, styles.resetButton]}
          onPress={() => setFilters({
            working: true,
            notWorking: true,
            dome: true,
            bullet: true,
            cmount: true,
            ptz: true,
            thermal: false,
            anpr: false,
            other: true
          })}
        >
          <Text style={styles.resetButtonText}>Reset All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterActionButton, styles.applyButton]}
          onPress={() => setShowFilters(false)}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
      </View>
    </TouchableWithoutFeedback>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 8,
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    marginLeft: 10,
    backgroundColor: '#34C759',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  radiusContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  radiusText: {
    marginBottom: 10,
    fontWeight: '500',
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 5,
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
  },
  filterOptions: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#555',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterLabel: {
    marginLeft: 10,
    fontSize: 15,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterActionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  resetButton: {
    backgroundColor: '#f1f1f1',
  },
  resetButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});