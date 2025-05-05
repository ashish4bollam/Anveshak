import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Divider,
  IconButton,
  SegmentedButtons,
  Chip,
} from "react-native-paper";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
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
  const [refreshing, setRefreshing] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);
  const [filters, setFilters] = useState({
    city: "",
    organization: "",
    workingCondition: "",
    deviceType: "",
    dateChecked: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [showCustomDeviceTypeInput, setShowCustomDeviceTypeInput] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const deviceTypes = [
    "Dome Camera",
    "Bullet Camera",
    "PTZ Camera",
    "C-Mount Camera",
    "Other",
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchUserCameras(true).then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchUserCameras(true);
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

    
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const username = userDoc.data()?.username;

        // Create the filtered query using the username
        let baseQuery = collection(db, "cctv_cameras");
        let filteredQuery = query(baseQuery, where("username", "==", username));

      if (filters.city) {
        filteredQuery = query(filteredQuery, where("city", "==", filters.city));
      }
      if (filters.organization) {
        filteredQuery = query(filteredQuery, where("organization", "==", filters.organization));
      }
      if (filters.workingCondition) {
        filteredQuery = query(filteredQuery, where("workingCondition", "==", filters.workingCondition));
      }
      if (filters.deviceType) {
        filteredQuery = query(filteredQuery, where("deviceType", "==", filters.deviceType));
      }
      if (filters.dateChecked) {
        filteredQuery = query(filteredQuery, where("dateChecked", "==", filters.dateChecked));
      }

      const snapshot = await getDocs(filteredQuery);
      const newCameras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CameraData[];

      setCameras(newCameras);
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
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSaveChanges = async () => {
    if (!editingCamera) return;

    if (!validatePhoneNumber(editingCamera.phoneNumber)) {
      setPhoneError("Phone number must be exactly 10 digits.");
      return;
    } else {
      setPhoneError("");
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

  const getStatusColor = (status: string) => {
    return status === "Working" ? "#4CAF50" : "#F44336";
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My CCTV Cameras</Text>
        <Button
          mode="outlined"
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterToggle}
          icon={showFilters ? "filter-off" : "filter"}
        >
          {showFilters ? "Hide Filters" : "Filters"}
        </Button>
      </View>

      {showFilters && (
        <Card style={styles.filterCard}>
          <Card.Content>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Cameras</Text>
              <Button mode="text" onPress={resetFilters}>
                Reset
              </Button>
            </View>

            <SegmentedButtons
              value={filters.workingCondition}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, workingCondition: value }))}
              buttons={[
                {
                  value: "Working",
                  label: "Working",
                  icon: "check",
                  style: filters.workingCondition === "Working" ? styles.activeFilterButton : null,
                },
                {
                  value: "Not Working",
                  label: "Not Working",
                  icon: "close",
                  style: filters.workingCondition === "Not Working" ? styles.activeFilterButton : null,
                },
                {
                  value: "",
                  label: "All",
                  icon: "filter-variant",
                  style: !filters.workingCondition ? styles.activeFilterButton : null,
                },
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="City"
              value={filters.city}
              onChangeText={(text) => setFilters((prev) => ({ ...prev, city: text }))}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="city" />}
            />

            <TextInput
              label="Organization"
              value={filters.organization}
              onChangeText={(text) => setFilters((prev) => ({ ...prev, organization: text }))}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="office-building" />}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Device Type</Text>
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
                <Picker.Item label="All Device Types" value="" />
                {deviceTypes.map((type, index) => (
                  <Picker.Item key={index} label={type} value={type} />
                ))}
              </Picker>
            </View>

            <Button
              mode="outlined"
              onPress={() => setShowFilterDatePicker(true)}
              style={styles.dateButton}
              icon="calendar"
            >
              {filters.dateChecked || "Filter by Date"}
            </Button>
            {showFilterDatePicker && (
              <DateTimePicker
                value={new Date(filters.dateChecked || Date.now())}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowFilterDatePicker(false);
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    setFilters((prev) => ({
                      ...prev,
                      dateChecked: `${year}-${month}-${day}`,
                    }));
                  }
                }}
              />
            )}
          </Card.Content>
        </Card>
      )}

      {loading && !refreshing && (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
      )}

      {cameras.length === 0 && !loading && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <IconButton
                icon="camera-off"
                iconColor="#9E9E9E"
                size={40}
                disabled={true}
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
            <Text style={styles.emptyText}>No cameras found</Text>
            <Text style={styles.emptySubtext}>
              {Object.values(filters).some(Boolean)
                ? "Try adjusting your filters"
                : "Add a new camera to get started"}
            </Text>
          </Card.Content>
        </Card>
      )}

      {cameras.map((camera) => (
        <Card key={camera.id} style={styles.cameraCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cameraTitle}>{camera.deviceName}</Text>
              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(camera.workingCondition) + "22" },
                ]}
                textStyle={{ color: getStatusColor(camera.workingCondition) }}
              >
                {camera.workingCondition}
              </Chip>
            </View>

            <View style={styles.infoRow}>
              <IconButton icon="account" size={20} iconColor="#6200EE" style={styles.infoIcon} />
              <Text style={styles.infoText}>{camera.ownerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <IconButton icon="phone" size={20} iconColor="#6200EE" style={styles.infoIcon} />
              <Text style={styles.infoText}>{camera.phoneNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <IconButton icon="map-marker" size={20} iconColor="#6200EE" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {camera.address}, {camera.city}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <IconButton icon="office-building" size={20} iconColor="#6200EE" style={styles.infoIcon} />
              <Text style={styles.infoText}>{camera.organization}</Text>
            </View>

            <View style={styles.infoRow}>
              <IconButton icon="calendar" size={20} iconColor="#6200EE" style={styles.infoIcon} />
              <Text style={styles.infoText}>Last checked: {camera.dateChecked}</Text>
            </View>

            <View style={styles.infoRow}>
              <IconButton icon="cctv" size={20} iconColor="#6200EE" style={styles.infoIcon} />
              <Text style={styles.infoText}>{camera.deviceType}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.cardActions}>
              <Button
                mode="contained-tonal"
                onPress={() => setEditingCamera(camera)}
                style={styles.actionButton}
                icon="pencil"
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleDelete(camera.id)}
                style={styles.actionButton}
                icon="delete"
                textColor="#F44336"
              >
                Delete
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}

      {editingCamera && (
        <Modal visible={!!editingCamera} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Camera</Text>
                  <IconButton
                    icon="close"
                    onPress={() => setEditingCamera(null)}
                    style={styles.closeButton}
                  />
                </View>

                <TextInput
                  label="Device Name *"
                  value={editingCamera.deviceName}
                  onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, deviceName: text }))}
                  style={styles.modalInput}
                  mode="outlined"
                  left={<TextInput.Icon icon="cctv" />}
                />

                <TextInput
                  label="Owner Name *"
                  value={editingCamera.ownerName}
                  onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, ownerName: text }))}
                  style={styles.modalInput}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                  label="Phone Number *"
                  value={editingCamera.phoneNumber}
                  onChangeText={(text) => {
                    setEditingCamera((prev) => ({ ...prev!, phoneNumber: text }));
                    setPhoneError("");
                  }}
                  style={styles.modalInput}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                  error={!!phoneError}
                />
                {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

                <TextInput
                  label="Address"
                  value={editingCamera.address}
                  onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, address: text }))}
                  style={styles.modalInput}
                  mode="outlined"
                  left={<TextInput.Icon icon="map-marker" />}
                />

                <TextInput
                  label="City"
                  value={editingCamera.city}
                  onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, city: text }))}
                  style={styles.modalInput}
                  mode="outlined"
                  left={<TextInput.Icon icon="city" />}
                />

                <TextInput
                  label="Organization"
                  value={editingCamera.organization}
                  onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, organization: text }))}
                  style={styles.modalInput}
                  mode="outlined"
                  left={<TextInput.Icon icon="office-building" />}
                />

                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Device Type *</Text>
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
                </View>

                {showCustomDeviceTypeInput && (
                  <TextInput
                    label="Enter Custom Device Type"
                    value={editingCamera.deviceType}
                    onChangeText={(text) => setEditingCamera((prev) => ({ ...prev!, deviceType: text }))}
                    style={styles.modalInput}
                    mode="outlined"
                  />
                )}

                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateInput}
                >
                  <TextInput
                    label="Date Checked *"
                    value={editingCamera.dateChecked}
                    style={styles.modalInput}
                    mode="outlined"
                    editable={false}
                    left={<TextInput.Icon icon="calendar" />}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(editingCamera.dateChecked || Date.now())}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setEditingCamera((prev) => ({
                          ...prev!,
                          dateChecked: `${year}-${month}-${day}`,
                        }));
                      }
                    }}
                  />
                )}

                <SegmentedButtons
                  value={editingCamera.workingCondition}
                  onValueChange={(value) =>
                    setEditingCamera((prev) => ({ ...prev!, workingCondition: value }))
                  }
                  buttons={[
                    {
                      value: "Working",
                      label: "Working",
                      icon: "check",
                      style:
                        editingCamera.workingCondition === "Working"
                          ? styles.activeStatusButton
                          : null,
                    },
                    {
                      value: "Not Working",
                      label: "Not Working",
                      icon: "close",
                      style:
                        editingCamera.workingCondition === "Not Working"
                          ? styles.inactiveStatusButton
                          : null,
                    },
                  ]}
                  style={styles.statusButtons}
                />

                <View style={styles.modalActions}>
                  <Button
                    mode="contained"
                    onPress={handleSaveChanges}
                    style={styles.saveButton}
                    loading={loading}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  filterToggle: {
    borderRadius: 8,
  },
  filterCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  activeFilterButton: {
    backgroundColor: "#E3F2FD",
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#FFF",
  },
  pickerContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  pickerLabel: {
    padding: 8,
    fontSize: 12,
    color: "#616161",
  },
  picker: {
    height: 50,
  },
  dateButton: {
    marginBottom: 12,
    backgroundColor: "#FFF",
  },
  loader: {
    marginVertical: 24,
  },
  emptyCard: {
    marginVertical: 16,
    borderRadius: 12,
    elevation: 1,
  },
  emptyContent: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#616161",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
  },
  cameraCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
    borderWidth: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoIcon: {
    margin: 0,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#424242",
    flex: 1,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: "#EEEEEE",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxHeight: "90%",
    borderRadius: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    margin: 0,
  },
  modalInput: {
    marginBottom: 12,
    backgroundColor: "#FFF",
  },
  dateInput: {
    marginBottom: 12,
  },
  activeStatusButton: {
    backgroundColor: "#E8F5E9",
  },
  inactiveStatusButton: {
    backgroundColor: "#FFEBEE",
  },
  statusButtons: {
    marginBottom: 16,
  },
  modalActions: {
    marginTop: 8,
  },
  saveButton: {
    borderRadius: 8,
    backgroundColor: "#6200EE",
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 8,
  },
});