import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Divider,
  IconButton,
  SegmentedButtons,
} from "react-native-paper";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getAuth } from "firebase/auth";
import { Picker } from "@react-native-picker/picker";

interface CameraData {
  id: string;
  ownerName: string;
  phoneNumber: string;
  deviceName: string;
  deviceType: string;
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  organization: string;
  workingCondition: string;
  dateChecked: string;
  username: string;
}

export default function MyCameras() {
  const router = useRouter();
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);
  const [filters, setFilters] = useState({
    city: "",
    organization: "",
    workingCondition: "",
    deviceType: "",
    dateChecked: "",
  });
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [showCustomDeviceTypeInput, setShowCustomDeviceTypeInput] = useState(false);

  // Popular CCTV camera types
  const deviceTypes = [
    "Dome Camera",
    "Bullet Camera",
    "PTZ Camera",
    "C-Mount Camera",
    "Infrared/Night Vision Camera",
    "Other",
  ];

  // Keep only one useEffect for filter changes
  useEffect(() => {
    console.log("Filters changed, fetching cameras...", filters);
    fetchUserCameras(true); // Reset the list when filters change
  }, [filters]);
  
  const fetchUserCameras = async (reset = false) => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to view your cameras.");
        setLoading(false);
        return;
      }
  
      // Log the filters to ensure they are updating correctly
      console.log("Current Filters:", filters);
  
      let baseQuery = collection(db, "cctv_cameras");
      // Only show cameras added by the logged-in user
      let filteredQuery = query(baseQuery, where("username", "==", user.email));
  
      // Apply additional filters (only if the filter value is not empty)
      if (filters.city && filters.city.trim() !== "") {
        filteredQuery = query(filteredQuery, where("city", "==", filters.city));
      }
      if (filters.organization && filters.organization.trim() !== "") {
        filteredQuery = query(filteredQuery, where("organization", "==", filters.organization));
      }
      if (filters.workingCondition && filters.workingCondition.trim() !== "") {
        filteredQuery = query(filteredQuery, where("workingCondition", "==", filters.workingCondition));
      }
      if (filters.deviceType && filters.deviceType.trim() !== "") {
        filteredQuery = query(filteredQuery, where("deviceType", "==", filters.deviceType));
      }
      if (filters.dateChecked && filters.dateChecked.trim() !== "") {
        filteredQuery = query(filteredQuery, where("dateChecked", "==", filters.dateChecked));
      }
  
      // Reset pagination when filters change
      if (reset) {
        setLastDoc(null);
        setHasMore(true);
      }
  
      // Add pagination
      if (!reset && lastDoc) {
        filteredQuery = query(filteredQuery, startAfter(lastDoc), limit(5));
      } else {
        filteredQuery = query(filteredQuery, limit(5));
      }
  
      const snapshot = await getDocs(filteredQuery);
      if (snapshot.empty) {
        if (reset) {
          setCameras([]); // Clear the cameras list when filter returns no results
        }
        setHasMore(false);
        setLoading(false);
        return;
      }
  
      // Log the query results
      console.log("Query Results:", snapshot.docs.map((doc) => doc.data()));
  
      const newCameras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CameraData[];
  
      // Use functional updates to avoid stale state issues
      setCameras(prevCameras => reset ? newCameras : [...prevCameras, ...newCameras]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (error) {
      console.error("Error fetching cameras:", error);
      Alert.alert("Error", "Failed to load cameras.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Confirm", "Are you sure you want to delete this camera?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          setLoading(true);
          try {
            await deleteDoc(doc(db, "cctv_cameras", id));
            Alert.alert("Deleted", "Camera entry deleted successfully.");
            fetchUserCameras(true);
          } catch (error) {
            console.error("Error deleting camera:", error);
            Alert.alert("Error", "Failed to delete camera.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\d{10}$/; // Regex to check if the phone number is exactly 10 digits
    return phoneRegex.test(phone);
  };

  const handleSaveChanges = async () => {
    if (!editingCamera) return;

    // Validate phone number
    if (!validatePhoneNumber(editingCamera.phoneNumber)) {
      setPhoneError("Phone number must be exactly 10 digits.");
      return;
    } else {
      setPhoneError(""); // Clear error if phone number is valid
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "cctv_cameras", editingCamera.id), {
        ...editingCamera,
      });
      Alert.alert("Success", "Camera details updated successfully.");
      setEditingCamera(null);
      fetchUserCameras(true);
    } catch (error) {
      console.error("Error updating camera:", error);
      Alert.alert("Error", "Failed to update camera details.");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      city: "",
      organization: "",
      workingCondition: "",
      deviceType: "",
      dateChecked: "",
    });
  };

  const loadMoreCameras = () => {
    if (!loading && hasMore) {
      fetchUserCameras(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        if (isCloseToBottom && !loading && hasMore) {
          loadMoreCameras();
        }
      }}
      scrollEventThrottle={400}
    >
      <Text style={styles.title}>My CCTV Cameras</Text>
      <View style={styles.filtersContainer}>
        {/* Working Condition Toggle */}
        <SegmentedButtons
          value={filters.workingCondition}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, workingCondition: value }))}
          buttons={[
            { value: "Working", label: "Working" },
            { value: "Not Working", label: "Not Working" },
            { value: "", label: "All" }, // Reset filter
          ]}
          style={styles.segmentedButtons}
        />

        {Object.keys(filters).map((key) => (
          <React.Fragment key={key}>
            {key === "dateChecked" ? (
              <View>
                <Button
                  mode="outlined"
                  onPress={() => setShowFilterDatePicker(true)}
                  style={styles.dateButton}
                >
                  {filters.dateChecked || "Select Date Checked"}
                </Button>
                {showFilterDatePicker && (
                  <DateTimePicker
                    value={new Date(filters.dateChecked || Date.now())}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowFilterDatePicker(false);
                      if (date) {
                        setFilters((prev) => ({
                          ...prev,
                          dateChecked: date.toISOString().split("T")[0],
                        }));
                      }
                    }}
                  />
                )}
              </View>
            ) : key === "deviceType" ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.deviceType}
                  onValueChange={(itemValue) => {
                    if (itemValue === "Other") {
                      setShowCustomDeviceTypeInput(true);
                      setFilters((prev) => ({ ...prev, deviceType: "" }));
                    } else {
                      setShowCustomDeviceTypeInput(false);
                      setFilters((prev) => ({ ...prev, deviceType: itemValue }));
                    }
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Device Type" value="" />
                  {deviceTypes.map((type, index) => (
                    <Picker.Item key={index} label={type} value={type} />
                  ))}
                </Picker>
                {showCustomDeviceTypeInput && (
                  <TextInput
                    label="Enter Custom Device Type"
                    value={filters.deviceType}
                    onChangeText={(text) => setFilters((prev) => ({ ...prev, deviceType: text }))}
                    style={styles.input}
                    mode="outlined"
                  />
                )}
              </View>
            ) : key !== "workingCondition" && (
              <TextInput
                label={`Filter by ${key
                  .replace("dateChecked", "Date Checked")
                  .replace("city", "City")
                  .replace("organization", "Organization")
                  .replace("deviceType", "Device Type")}`}
                value={filters[key as keyof typeof filters]}
                onChangeText={(text) => setFilters((prev) => ({ ...prev, [key]: text }))}
                style={styles.input}
                mode="outlined"
              />
            )}
          </React.Fragment>
        ))}

        {/* Reset Filters Button */}
        <Button mode="outlined" onPress={resetFilters} style={styles.resetButton}>
          Reset Filters
        </Button>
      </View>

      {loading && <ActivityIndicator size="large" color="#4A90E2" />}

      {cameras.length === 0 && !loading && (
        <Text style={styles.noResultsText}>No cameras found matching the current filters.</Text>
      )}

      {cameras.map((camera) => (
        <Card key={camera.id} style={styles.card}>
          <Card.Content>
            <Text style={styles.cameraTitle}>{camera.deviceName}</Text>
            <Text style={styles.subtitle}>📍 {camera.address}</Text>
            <Text>👤 {camera.ownerName}</Text>
            <Text>📞 {camera.phoneNumber}</Text>
            <Text>🏢 {camera.organization}</Text>
            <Text>🔧 {camera.workingCondition}</Text>
            <Text>📅 Last Checked: {camera.dateChecked}</Text>
            <Text>📡 Device Type: {camera.deviceType}</Text>
            <Divider style={styles.divider} />
            <View style={styles.buttonRow}>
              <IconButton icon="pencil" onPress={() => setEditingCamera(camera)} />
              <IconButton icon="delete" onPress={() => handleDelete(camera.id)} />
            </View>
          </Card.Content>
        </Card>
      ))}

      {hasMore && !loading && cameras.length > 0 && (
        <Button mode="text" onPress={loadMoreCameras} style={styles.loadMoreButton}>
          Load More
        </Button>
      )}

      {editingCamera && (
        <Modal visible={!!editingCamera} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <Card style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Camera Details</Text>
              <TextInput
                label="Device Name"
                value={editingCamera.deviceName}
                onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, deviceName: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Owner Name"
                value={editingCamera.ownerName}
                onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, ownerName: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Phone Number"
                value={editingCamera.phoneNumber}
                onChangeText={(text) => {
                  setEditingCamera((prev) => ({ ...prev!, phoneNumber: text }));
                  setPhoneError(""); // Clear error when user types
                }}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              <TextInput
                label="Address"
                value={editingCamera.address}
                onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, address: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="City"
                value={editingCamera.city}
                onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, city: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Organization"
                value={editingCamera.organization}
                onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, organization: text }))}
                style={styles.input}
                mode="outlined"
              />
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Device Type</Text>
                <Picker
                  selectedValue={editingCamera.deviceType}
                  onValueChange={(itemValue) => {
                    if (itemValue === "Other") {
                      setShowCustomDeviceTypeInput(true);
                    } else {
                      setShowCustomDeviceTypeInput(false);
                      setEditingCamera((prev) => ({ ...prev!, deviceType: itemValue }));
                    }
                  }}
                  style={styles.picker}
                >
                  {deviceTypes.map((type, index) => (
                    <Picker.Item key={index} label={type} value={type} />
                  ))}
                </Picker>
                {showCustomDeviceTypeInput && (
                  <TextInput
                    label="Enter Custom Device Type"
                    value={editingCamera.deviceType}
                    onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, deviceType: text }))}
                    style={styles.input}
                    mode="outlined"
                  />
                )}
              </View>
              <Button mode="contained" onPress={() => setShowDatePicker(true)} style={styles.button}>
                {editingCamera.dateChecked || "Select Date Checked"}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(editingCamera.dateChecked || Date.now())}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setEditingCamera((prev) => ({ ...prev!, dateChecked: date.toISOString().split("T")[0] }));
                    }
                  }}
                />
              )}
              <SegmentedButtons
                value={editingCamera.workingCondition}
                onValueChange={(value) => setEditingCamera((prev) => ({ ...prev!, workingCondition: value }))}
                buttons={[
                  { value: "Working", label: "Working" },
                  { value: "Not Working", label: "Not Working" },
                ]}
                style={styles.segmentedButtons}
              />
              <View style={styles.buttonRow}>
                <Button mode="contained" onPress={handleSaveChanges} style={styles.saveButton}>
                  <Text style={styles.buttonText}>Save Changes</Text>
                </Button>
                <Button mode="contained" onPress={() => setEditingCamera(null)} style={styles.cancelButton}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Button>
              </View>
            </Card>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#F7F9FC" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#333" },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 16, color: "#333" },
  filtersContainer: { marginBottom: 16 },
  input: { marginBottom: 10, backgroundColor: "#FFF" },
  card: { marginBottom: 16, padding: 16, backgroundColor: "#FFF", borderRadius: 8, elevation: 2 },
  cameraTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 14, color: "#666" },
  divider: { marginVertical: 8, backgroundColor: "#EEE" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { padding: 20, borderRadius: 10, width: "85%", backgroundColor: "#FFF" },
  button: { marginVertical: 10, backgroundColor: "#4A90E2" },
  saveButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: "#4A90E2",
    borderRadius: 5,
    justifyContent: "center",
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "#E63946",
    borderRadius: 5,
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  segmentedButtons: { marginVertical: 10 },
  errorText: {
    color: "#E63946",
    fontSize: 12,
    marginBottom: 10,
  },
  dateButton: {
    marginBottom: 10,
    backgroundColor: "#FFF",
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: "#555",
  },
  picker: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: "#FFF",
    borderColor: "#4A90E2",
  },
  loadMoreButton: {
    marginVertical: 10,
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});