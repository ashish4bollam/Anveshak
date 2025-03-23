import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
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
  workingCondition: string; // "Working" or "Not Working"
  username?: string;
  policeId?: string;
  dateChecked?: string;
}

// Validation function: returns first encountered error report.
const validateExcelData = async (data: any[], userData: { username: string; policeId: string } | null): Promise<{ valid: boolean; report: string[] }> => {
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
    "policeId",
    "username",
    "dateChecked",
  ];
  let errors: string[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];

    // Check for missing required columns
    for (let col of requiredColumns) {
      if (!row[col] || row[col].toString().trim() === "") {
        errors.push(`Row ${index + 1} is missing value for "${col}".`);
        console.log(`Row ${index + 1} is missing value for "${col}".`);
      }
    }

    // Validate phone number format (if present)
    if (row["phoneNumber"] && !/^\d{10}$/.test(row["phoneNumber"].toString().trim())) {
      errors.push(`Row ${index + 1} has an invalid phone number: "${row["phoneNumber"]}".`);
      console.log(`Row ${index + 1} has an invalid phone number: "${row["phoneNumber"]}".`);
    }

    // Validate date format (if present)
    if (row["dateChecked"] && !/^\d{4}-\d{2}-\d{2}$/.test(row["dateChecked"].toString().trim())) {
      errors.push(`Row ${index + 1} has an invalid date format: "${row["dateChecked"]}".`);
      console.log(`Row ${index + 1} has an invalid date format: "${row["dateChecked"]}".`);
    }

    // Check for duplicates
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
      console.log(`Row ${index + 1} is a duplicate entry: Device "${row.deviceName}" at (${row.latitude}, ${row.longitude}) already exists.`);
    }
  }

  return { valid: errors.length === 0, report: errors };
};

export default function AddCamera() {
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
  const [userData, setUserData] = useState<{ username: string; policeId: string } | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomDeviceTypeInput, setShowCustomDeviceTypeInput] = useState(false);

  useEffect(() => {
    const authInstance = getAuth();
    onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        const userRef = collection(db, "users");
        const userSnapshot = await getDocs(userRef);
        const userInfo = userSnapshot.docs.find((doc) => doc.id === user.uid)?.data();
        if (userInfo) {
          setUserData({ username: userInfo.username, policeId: userInfo.policeId });
        }
      }
    });
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
    handleInputChange("dateChecked", currentDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
  };

  const getLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Permission to access location was denied");
      setLoading(false);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    handleInputChange("latitude", location.coords.latitude.toString());
    handleInputChange("longitude", location.coords.longitude.toString());
    let geocode = await Location.reverseGeocodeAsync(location.coords);
    if (geocode.length > 0) {
      const addr = [geocode[0].name, geocode[0].city, geocode[0].region]
        .filter(Boolean)
        .join(", ");
      handleInputChange("address", addr);
    }
    setLoading(false);
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
      // Check for duplicates
      const camerasRef = collection(db, "cctv_cameras");
      const q = query(
        camerasRef,
        where("deviceName", "==", formData.deviceName),
        where("latitude", "==", formData.latitude),
        where("longitude", "==", formData.longitude)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Duplicate found
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
                  policeId: userData?.policeId,
                };
                await addDoc(camerasRef, finalData);
                Alert.alert("Success", "Camera details submitted successfully!");
                router.push("/dashboard");
              },
            },
          ]
        );
      } else {
        // No duplicate found, proceed with submission
        const finalData = {
          ...formData,
          username: userData?.username,
          policeId: userData?.policeId,
        };
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
      console.log("Document Picker Result:", res);

      if (res.canceled) {
        console.log("User cancelled the picker");
        return;
      }

      if (!res.assets || res.assets.length === 0) {
        Alert.alert("Error", "No file was selected.");
        return;
      }
      const asset = res.assets[0];
      const fileUri: string | undefined = asset.uri;
      const fileName: string | undefined = asset.name;

      if (!fileUri) {
        Alert.alert("Error", "File URI is undefined.");
        return;
      }
      if (!fileName) {
        Alert.alert("Error", "File name is undefined.");
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

      // Validate data and check for duplicates
      const { valid, report } = await validateExcelData(parsedData, userData);

      if (!valid) {
        router.push({
          pathname: "/ValidationReportScreen",
          params: { report: JSON.stringify(report) }, // Encode as JSON,
        } as any);
        return;
      }

      setLoading(true);
      console.log("Parsed Data:", parsedData);

      // Upload each record after trimming and defaulting values.
      for (const record of parsedData) {
        if (record && typeof record === "object" && !Array.isArray(record)) {
          console.log("Parsed record keys:", Object.keys(record));
          console.log("Record policeId before trimming:", record.policeId);
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
            policeId: (record.policeId || userData?.policeId || "UNKNOWN_ID").trim(),
            dateChecked: (record.dateChecked || new Date().toISOString().split("T")[0]).trim(),
          };

          console.log("Final data being uploaded:", finalData);
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

  // Download template file as CSV and save to local storage.
  const handleDownloadTemplate = async () => {
    const csvTemplate = `ownerName,phoneNumber,deviceName,deviceType,latitude,longitude,address,city,organization,workingCondition,policeId,dateChecked
John Doe,9876543210,Main Entrance,CCTV,30.9810,76.5350,"IIT Ropar Campus",Rupnagar,IIT Ropar,Working,PR12345,2023-10-01
`;
    const fileUri = FileSystem.documentDirectory + "template.csv";
    try {
      await FileSystem.writeAsStringAsync(fileUri, csvTemplate, { encoding: FileSystem.EncodingType.UTF8 });
      Alert.alert("Template Downloaded", `Template saved as CSV in local storage:\n${fileUri}`);
    } catch (error) {
      console.error("Error downloading template:", error);
      Alert.alert("Error", "Failed to download template.");
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
              formData.workingCondition === "Working" && styles.conditionButtonSelected,
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
              formData.workingCondition === "Not Working" && styles.conditionButtonSelected,
            ]}
          >
            Not Working
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add CCTV Camera</Text>

      <View style={styles.formGroup}>
        <TextInput
          label="City"
          mode="outlined"
          value={formData.city}
          onChangeText={(val) => handleInputChange("city", val)}
          style={styles.input}
        />
        <TextInput
          label="Organization"
          mode="outlined"
          value={formData.organization}
          onChangeText={(val) => handleInputChange("organization", val)}
          style={styles.input}
        />
        <TextInput
          label="Owner Name"
          mode="outlined"
          value={formData.ownerName}
          onChangeText={(val) => handleInputChange("ownerName", val)}
          style={styles.input}
        />
        <TextInput
          label="Phone Number"
          mode="outlined"
          value={formData.phoneNumber}
          onChangeText={(val) => handleInputChange("phoneNumber", val)}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          label="Device Name"
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
              setShowCustomDeviceTypeInput(itemValue === "oth"); // Show custom input if "Other" is selected
            }}
          >
            <Picker.Item label="Dome Camera" value="dome" />
            <Picker.Item label="Bullet Camera" value="bullet" />
            <Picker.Item label="C-Mount Camera" value="cmount" />
            <Picker.Item label="PTZ Camera" value="ptz" />
            <Picker.Item label="Other" value="oth" />
          </Picker>
        </View>
        {showCustomDeviceTypeInput && (
          <TextInput
            label="Custom Device Type"
            mode="outlined"
            value={formData.deviceType}
            onChangeText={(val) => handleInputChange("deviceType", val)}
            style={styles.input}
          />
        )}
        <TextInput
          label="Address"
          mode="outlined"
          value={formData.address}
          onChangeText={(val) => handleInputChange("address", val)}
          style={styles.input}
        />
        <TextInput
          label="Latitude"
          mode="outlined"
          value={formData.latitude}
          onChangeText={(val) => handleInputChange("latitude", val)}
          style={styles.input}
        />
        <TextInput
          label="Longitude"
          mode="outlined"
          value={formData.longitude}
          onChangeText={(val) => handleInputChange("longitude", val)}
          style={styles.input}
        />
        <View style={styles.input}>
          <Button onPress={() => setShowDatePicker(true)} mode="outlined">
            Select Date Checked
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
          <TextInput
            label="Date Checked"
            mode="outlined"
            value={formData.dateChecked}
            editable={false}
            style={styles.input}
          />
        </View>
        {renderWorkingConditionSelector()}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={getLocation}
          style={[styles.button, styles.buttonPrimary]}
          labelStyle={styles.buttonLabel}
        >
          Get Location
        </Button>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={[styles.button, styles.buttonSuccess]}
          labelStyle={styles.buttonLabel}
        >
          Submit
        </Button>

        <Button
          mode="contained"
          onPress={handleFileUpload}
          style={[styles.button, styles.buttonDanger]}
          labelStyle={styles.buttonLabel}
        >
          Upload
        </Button>

        <Button
          mode="contained"
          onPress={handleDownloadTemplate}
          style={[styles.button, styles.buttonTemplate]}
          labelStyle={styles.buttonLabel}
        >
          Download Template
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F7F9FC",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 28,
    textAlign: "center",
    color: "#1A365D",
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#FAFBFF",
  },
  conditionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  conditionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 6,
    backgroundColor: "#FAFBFF",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  conditionButtonSelected: {
    backgroundColor: "#0EA5E9",
    borderColor: "#0284C7",
    color: "#FFFFFF",
  },
  conditionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  buttonContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 24,
  },
  button: {
    width: "85%",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPrimary: {
    backgroundColor: "#3B82F6", // Blue
  },
  buttonSuccess: {
    backgroundColor: "#10B981", // Green
  },
  buttonDanger: {
    backgroundColor: "#F43F5E", // Red
  },
  buttonTemplate: {
    backgroundColor: "#8B5CF6", // Purple
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});