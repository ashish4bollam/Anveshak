import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { TextInput, Button, Text, Surface, SegmentedButtons, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import * as FileSystem from "expo-file-system";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as Sharing from 'expo-sharing';
interface FormData {
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
  username?: string;
  policeID?: string;
  dateChecked?: string;
}



export default function AddCamera() {

  const validateExcelData = async (data: any[], userData: { username: string; policeID: string } | null): Promise<{ valid: boolean; report: string[] }> => {
    const requiredColumns = [
      "ownerName",
      "phoneNumber",
      "deviceName",
      "deviceType",
      "latitude",
      "longitude",
      "address",
      "city",
      "organization",
      "workingCondition",
      "policeID",
      "username",
      "dateChecked",
    ];
    let errors: string[] = [];

    setLoading(true);
  
  
  
    for (let index = 0; index < data.length; index++) {
      const row = data[index];
  
      for (let col of requiredColumns) {
        if (!row[col] || row[col].toString().trim() === "") {
          errors.push(`Row ${index + 1} is missing value for "${col}".`);
        }
      }
  
      if (row["phoneNumber"] && !/^\d{10}$/.test(row["phoneNumber"].toString().trim())) {
        errors.push(`Row ${index + 1} has an invalid phone number: "${row["phoneNumber"]}".`);
      }
  
      if (row["dateChecked"]) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row["dateChecked"].toString().trim())) {
          errors.push(`Row ${index + 1} has an invalid date format: "${row["dateChecked"]}".`);
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const inputDate = new Date(row["dateChecked"]);
          if (inputDate > today) {
            errors.push(`Row ${index + 1} has a future date: "${row["dateChecked"]}".`);
          }
        }
      }
  
      const camerasRef = collection(db, "cctv_cameras");
      const q = query(
        camerasRef,
        where("deviceName", "==", row.deviceName),
        where("latitude", "==", row.latitude),
        where("longitude", "==", row.longitude)
      );
  
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        errors.push(`Row ${index + 1} is a duplicate entry: Device "${row.deviceName}" at (${row.latitude}, ${row.longitude}) already exists.`);
      }
    }
    setLoading(false);
  
    return { valid: errors.length === 0, report: errors };
  };
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    ownerName: "",
    phoneNumber: "",
    deviceName: "",
    deviceType: "",
    latitude: "",
    longitude: "",
    address: "",
    city: "",
    organization: "",
    workingCondition: "",
    dateChecked: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<{ username: string; policeID: string } | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomDeviceTypeInput, setShowCustomDeviceTypeInput] = useState(false);
  const [activeTab, setActiveTab] = useState("form");

  useEffect(() => {
    const authInstance = getAuth();
    onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        const userRef = collection(db, "users");
        const userSnapshot = await getDocs(userRef);
        const userInfo = userSnapshot.docs.find((doc) => doc.id === user.uid)?.data();
        if (userInfo) {
          setUserData({ username: userInfo.username, policeID: userInfo.policeID });
        }
       ;
      }
    });
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // Hide the date picker regardless of selection
    setShowDatePicker(false);
    
    // Return if user cancelled the selection
    if (!selectedDate) return;
    
    // Create comparison dates at midnight to ignore time components
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);
    
    // Check if selected date is in the future
    if (selectedDay > today) {
      Alert.alert("Invalid Date", "You cannot select a future date.");
      return;
    }
    
    // Update the state with the selected date
    setDate(selectedDate);
    
    // Format the date correctly without timezone conversion
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    
    // Update the form data with properly formatted date
    handleInputChange("dateChecked", `${year}-${month}-${day}`);
  };

  const getLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Permission to access location was denied");
      setLoading(false);
      return;
    }
  
    try {
      // Get device coordinates
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      handleInputChange("latitude", latitude.toString());
      handleInputChange("longitude", longitude.toString());
  
      // Use Nominatim reverse geocoding
      let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      
      let response = await fetch(url, {
        headers: {
          "User-Agent": "YourAppName/1.0 (your@email.com)",
          "Accept": "application/json"
        }
      });
  
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  
      let data = await response.json();
      console.log("Nominatim reverse geocode:", data);
  
      if (data.address) {
        const { address, display_name } = data;
        
        // Use display_name as primary address source (most complete)
        let formattedAddress = display_name;
        
        // Remove any Plus Codes if present
        formattedAddress = formattedAddress.replace(/[A-Z0-9]+\+[A-Z0-9]+,\s*/g, '');
        
        handleInputChange("address", formattedAddress);
  
        // City detection - try standard fields in order of specificity
        const cityFields = [
          'city',
          'town', 
          'village',
          'municipality',
          'county',
          'state_district'
        ];
        
        let city = data.address.state_district;
        
        
        handleInputChange("city", city || "");
  
      } else {
        handleInputChange("address", `Near ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        handleInputChange("city", "");
      }
  
    } catch (error) {
      console.error("Location Error:", error);
      Alert.alert("Error", "Failed to get address details. Please try again or enter manually.");
    } finally {
      setLoading(false);
    }
  };
  const validateForm = (): boolean => {
    const { city, organization, ownerName, phoneNumber, deviceName, deviceType, latitude, longitude, address, workingCondition, dateChecked } = formData;
    if (!city || !organization || !ownerName || !phoneNumber || !deviceName || !deviceType || !latitude || !longitude || !address || !workingCondition || !dateChecked) {
      Alert.alert("Missing Fields", "Please fill in all mandatory fields.");
      return false;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      Alert.alert("Invalid Phone Number", "Phone number must be exactly 10 digits.");
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateChecked)) {
      Alert.alert("Invalid Date", "Date must be in the format YYYY-MM-DD.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const camerasRef = collection(db, "cctv_cameras");
      const q = query(
        camerasRef,
        where("deviceName", "==", formData.deviceName),
        where("latitude", "==", formData.latitude),
        where("longitude", "==", formData.longitude)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        Alert.alert(
          "Duplicate Entry",
          "A camera with the same details already exists. Do you want to proceed?",
          [
            {
              text: "Cancel",
              onPress: () => {
                setLoading(false);
                return;
              },
              style: "cancel",
            },
            {
              text: "Proceed",
              onPress: async () => {
                const finalData = {
                  ...formData,
                  username: userData?.username,
                  policeID: userData?.policeID,
                };
               
                await addDoc(camerasRef, finalData);
                Alert.alert("Success", "Camera details submitted successfully!");
                router.push("/dashboard");
              },
            },
          ]
        );
      } else {
        const finalData = {
          ...formData,
          username: userData?.username,
          policeID: userData?.policeID,
        };
        console.log(userData);
        await addDoc(camerasRef, finalData);
        Alert.alert("Success", "Camera details submitted successfully!");
        router.push("/dashboard");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit data.");
      console.error("Firestore Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const res: any = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      if (!res.assets || res.assets.length === 0) {
        Alert.alert("Error", "No file was selected.");
        return;
      }
      const asset = res.assets[0];
      const fileUri: string | undefined = asset.uri;
      const fileName: string | undefined = asset.name;

      if (!fileUri || !fileName) {
        Alert.alert("Error", "Invalid file selection.");
        return;
      }

      const fileExtension = fileName.split(".").pop()?.toLowerCase();
      if (!fileExtension) {
        Alert.alert("Error", "Could not determine file extension.");
        return;
      }

      let parsedData: any[] = [];

      if (fileExtension === "csv") {
        const response = await fetch(fileUri);
        const fileText = await response.text();
        parsedData = Papa.parse(fileText, { header: true }).data;
      } else if (fileExtension === "xls" || fileExtension === "xlsx") {
        const response = await fetch(fileUri);
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        Alert.alert("Error", "Unsupported file type. Please upload a CSV or Excel file.");
        return;
      }

      if (!parsedData || parsedData.length === 0) {
        Alert.alert("Error", "No valid data found in the file.");
        return;
      }

      const { valid, report } = await validateExcelData(parsedData, userData);

      if (!valid) {
        router.push({
          pathname: "/ValidationReportScreen",
          params: { report: JSON.stringify(report) },
        } as any);
        return;
      }

      setLoading(true);

      for (const record of parsedData) {
        if (record && typeof record === "object" && !Array.isArray(record)) {
          const finalData: FormData = {
            ownerName: (record.ownerName || "").trim(),
            phoneNumber: (record.phoneNumber || "").trim(),
            deviceName: (record.deviceName || "").trim(),
            deviceType: (record.deviceType || "").trim(),
            latitude: (record.latitude || "").trim(),
            longitude: (record.longitude || "").trim(),
            address: (record.address || "").trim(),
            city: (record.city || "").trim(),
            organization: (record.organization || "").trim(),
            workingCondition: (record.workingCondition || "").trim(),
            username: (record?.username || "").trim(),
            policeID: (record.policeID || userData?.policeID || "UNKNOWN_ID").trim(),
            dateChecked: (record.dateChecked || new Date().toISOString().split("T")[0]).trim(),
          };
          await addDoc(collection(db, "cctv_cameras"), finalData);
        }
      }

      Alert.alert("Success", "File uploaded and data populated successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error("File Upload Error:", err);
      Alert.alert("Error", "Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setLoading(true);
    
    try {
      // Create worksheet data
      const worksheetData = [
        ["ownerName", "phoneNumber", "deviceName", "deviceType", "latitude", "longitude", 
         "address", "city", "organization", "workingCondition", "policeID", "dateChecked", "username"],
        ["John Doe", "9876543210", "Main Entrance", "CCTV", "30.9810", "76.5350", 
         "IIT Ropar Campus", "Rupnagar", "IIT Ropar", "Working", "PR12345", "2023-10-01", "Ashish"]
      ];
  
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "CCTV Template");
  
      // Generate Excel file
      const excelFileData = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      // Create filename with current date
      const fileName = `cctv_template_${new Date().toISOString().split('T')[0]}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      // Write the Excel file
      await FileSystem.writeAsStringAsync(fileUri, excelFileData, {
        encoding: FileSystem.EncodingType.Base64
      });
  
      // Show action sheet with options
      Alert.alert(
        "Save Template",
        "Choose how you want to save the template:",
        [
          {
            text: "Share via System",
            onPress: async () => {
              try {
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  dialogTitle: 'Save CCTV Template',
                  UTI: 'org.openxmlformats.spreadsheet'
                });
              } catch (shareError) {
                Alert.alert("Error", "Sharing failed. Please try saving locally.");
              }
            }
          },
          {
            text: "Save Locally",
            onPress: async () => {
              try {
                const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permission.granted) {
                  const localFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    permission.directoryUri,
                    fileName,
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  );
                  
                  await FileSystem.writeAsStringAsync(localFileUri, excelFileData, {
                    encoding: FileSystem.EncodingType.Base64
                  });
                  
                  Alert.alert("Success", "Excel template saved to local storage");
                } else {
                  Alert.alert("Info", "Permission denied. Template was not saved.");
                }
              } catch (saveError) {
                Alert.alert("Error", "Failed to save Excel template locally.");
              }
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
      
    } catch (error) {
      console.error("Template Error:", error);
      Alert.alert("Error", "Failed to create Excel template file.");
    } finally {
      setLoading(false);
    }
  };

  const renderWorkingConditionSelector = () => {
    return (
      <View style={styles.conditionContainer}>
        <TouchableOpacity
          style={[
            styles.conditionButton,
            formData.workingCondition === "Working" && styles.conditionButtonSelected,
          ]}
          onPress={() => handleInputChange("workingCondition", "Working")}
        >
          <Text
            style={[
              styles.conditionText,
              formData.workingCondition === "Working" && styles.conditionTextSelected,
            ]}
          >
            Working
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.conditionButton,
            formData.workingCondition === "Not Working" && styles.conditionButtonSelected,
          ]}
          onPress={() => handleInputChange("workingCondition", "Not Working")}
        >
          <Text
            style={[
              styles.conditionText,
              formData.workingCondition === "Not Working" && styles.conditionTextSelected,
            ]}
          >
            Not Working
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFormTab = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <TextInput
          label="Device Name *"
          mode="outlined"
          value={formData.deviceName}
          onChangeText={(val) => handleInputChange("deviceName", val)}
          style={styles.input}
        />
        <View style={styles.input}>
          <Picker
            selectedValue={formData.deviceType}
            onValueChange={(itemValue) => {
              handleInputChange("deviceType", itemValue);
              setShowCustomDeviceTypeInput(itemValue === "oth");
            }}
          >
            <Picker.Item label="Select Device Type *" value="" />
            <Picker.Item label="Dome Camera" value="dome" />
            <Picker.Item label="Bullet Camera" value="bullet" />
            <Picker.Item label="C-Mount Camera" value="cmount" />
            <Picker.Item label="PTZ Camera" value="ptz" />
            <Picker.Item label="Other" value="oth" />
          </Picker>
        </View>
        {showCustomDeviceTypeInput && (
          <TextInput
            label="Custom Device Type *"
            mode="outlined"
            value={formData.deviceType}
            onChangeText={(val) => handleInputChange("deviceType", val)}
            style={styles.input}
          />
        )}
        {renderWorkingConditionSelector()}
        
        <View style={styles.input}>
          <Button 
            onPress={() => setShowDatePicker(true)} 
            mode="outlined"
            icon="calendar"
          >
            Select Date Checked *
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}

            />
          )}
          <TextInput
            label="Date Checked *"
            mode="outlined"
            value={formData.dateChecked}
            editable={false}
            style={{marginTop: 8}}
          />
        </View>

        <Text style={styles.sectionTitle}>Location Details</Text>
        <View style={styles.locationContainer}>
          <View style={styles.locationInputs}>
            <TextInput
              label="Latitude *"
              mode="outlined"
              value={formData.latitude}
              onChangeText={(val) => handleInputChange("latitude", val)}
              style={[styles.input, styles.locationInput]}
              keyboardType="numeric"
            />
            <TextInput
              label="Longitude *"
              mode="outlined"
              value={formData.longitude}
              onChangeText={(val) => handleInputChange("longitude", val)}
              style={[styles.input, styles.locationInput]}
              keyboardType="numeric"
            />
          </View>
          <IconButton
            icon="crosshairs-gps"
            size={24}
            mode="contained"
            onPress={getLocation}
            style={styles.locationButton}
            disabled={loading}
          />
        </View>
        
        <TextInput
          label="Address *"
          mode="outlined"
          value={formData.address}
          onChangeText={(val) => handleInputChange("address", val)}
          style={styles.input}
        />
        <TextInput
          label="City *"
          mode="outlined"
          value={formData.city}
          onChangeText={(val) => handleInputChange("city", val)}
          style={styles.input}
        />
        <TextInput
          label="Organization *"
          mode="outlined"
          value={formData.organization}
          onChangeText={(val) => handleInputChange("organization", val)}
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Owner Information</Text>
        <TextInput
          label="Owner Name *"
          mode="outlined"
          value={formData.ownerName}
          onChangeText={(val) => handleInputChange("ownerName", val)}
          style={styles.input}
        />
        <TextInput
          label="Phone Number *"
          mode="outlined"
          value={formData.phoneNumber}
          onChangeText={(val) => handleInputChange("phoneNumber", val)}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          labelStyle={styles.buttonLabel}
          loading={loading}
          icon="check-circle"
        >
          Submit
        </Button>
      </View>
    );
  };

  const renderBulkUploadTab = () => {
    return (
      <View style={styles.formGroup}>
        <Surface style={styles.templateSection}>
          <Text style={styles.templateTitle}>Download Template</Text>
          <Button
            mode="contained"
            onPress={handleDownloadTemplate}
            style={styles.templateButton}
            labelStyle={styles.buttonLabel}
            icon="download"
          >
            Get Template File
          </Button>
        </Surface>
        
        <Surface style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Upload Your File</Text>
          <Text style={styles.uploadSubtitle}>CSV or Excel format only</Text>
          <Button
            mode="contained"
            onPress={handleFileUpload}
            style={styles.uploadButton}
            labelStyle={styles.buttonLabel}
            loading={loading}
            icon="file-upload"
          >
            Select File
          </Button>
        </Surface>
        
        <Text style={styles.requirementsTitle}>Required Fields:</Text>
        <Text style={styles.requirementsText}>
          • ownerName, phoneNumber, deviceName, deviceType{'\n'}
          • latitude, longitude, address, city{'\n'}
          • organization, workingCondition, policeID,username{'\n'}
          • dateChecked (YYYY-MM-DD, no future dates)
        </Text>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add CCTV Camera</Text>
      
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'form', label: 'Form Entry', icon: 'form-select' },
            { value: 'bulk', label: 'Bulk Upload', icon: 'file-upload-outline' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {loading && <ActivityIndicator style={styles.loader} size="large" color="#3B82F6" />}
      
      {activeTab === "form" ? renderFormTab() : renderBulkUploadTab()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#F5F7FA",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
    color: "#1A365D",
  },
  tabContainer: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginHorizontal: 8,
  },
  formGroup: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
    color: "#2D3748",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#FAFBFF",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationInputs: {
    flex: 1,
    flexDirection: "row",
  },
  locationInput: {
    flex: 1,
    marginRight: 8,
  },
  locationButton: {
    backgroundColor: "#3B82F6",
    marginLeft: 4,
  },
  conditionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  conditionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: "#FAFBFF",
    alignItems: "center",
  },
  conditionButtonSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#2563EB",
  },
  conditionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  conditionTextSelected: {
    color: "#FFFFFF",
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: "#10B981",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  templateSection: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#F0F9FF",
    elevation: 1,
    alignItems: 'center',
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B6CB0",
    marginBottom: 12,
  },
  templateButton: {
    backgroundColor: "#2B6CB0",
    borderRadius: 8,
    width: '100%',
  },
  uploadSection: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    elevation: 1,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: "#4A5568",
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: "#047857",
    borderRadius: 8,
    width: '100%',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
    marginTop: 8,
    marginBottom: 4,
  },
  requirementsText: {
    fontSize: 13,
    color: "#4A5568",
    lineHeight: 20,
  },
  loader: {
    marginVertical: 16,
  }
});