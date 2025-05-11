import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { Text, Card, Button, ActivityIndicator, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebaseConfig";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { MaterialIcons } from '@expo/vector-icons';

interface UserData {
  email: string;
  username: string;
  type: string;
  name?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeDevices, setActiveDevices] = useState(0);
  const [inactiveDevices, setInactiveDevices] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchData = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user?.email) return;

      // Get user type from Google Sheets
      const csvResponse = await fetch(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaKEggp_5qZDxpP6Pw-9k0XHDF6jYxwzNnfqloB7_rF6EyNdac-SkFx8E7mtrRVthqQdxMRFtDDW-l/pub?output=csv'
      );
      const csvData = await csvResponse.text();
      const { data } = Papa.parse<UserData>(csvData, { header: true });
      
      const currentUser = data.find(u => u.email === user.email);
      if (currentUser) {
        setUserData(currentUser);
      }

      // Get device statistics
      const devicesQuery = currentUser?.type === 'admin' 
        ? collection(db, "cctv_cameras")
        : query(collection(db, "cctv_cameras"), where("username", "==", currentUser?.username || ''));
      
      const snapshot = await getDocs(devicesQuery);
      
      let active = 0, inactive = 0;
      snapshot.forEach(doc => {
        doc.data().workingCondition === "Working" ? active++ : inactive++;
      });
      
      setActiveDevices(active);
      setInactiveDevices(inactive);

    } catch (error) {
      Alert.alert("Error", "Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDownloadExcel = async (saveLocally: boolean) => {
    if (saveLocally) {
      setDownloading(true);
    } else {
      setSharing(true);
    }

    try {
      if (!userData) throw new Error("User data not available");

      const devicesQuery = userData.type === 'admin'
        ? collection(db, "cctv_cameras")
        : query(collection(db, "cctv_cameras"), where("username", "==", userData.username));

      const snapshot = await getDocs(devicesQuery);
      const devicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(devicesData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "CCTV Devices");
      
      const excelBase64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const fileName = `CCTV_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, excelBase64, {
        encoding: FileSystem.EncodingType.Base64
      });

      if (saveLocally) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const localUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          );
          await FileSystem.writeAsStringAsync(localUri, excelBase64, {
            encoding: FileSystem.EncodingType.Base64
          });
          Alert.alert("Success", "File saved to your device's Documents");
        } else {
          Alert.alert("Permission Needed", "Please allow storage access to save files");
        }
      } else {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Share CCTV Data',
          UTI: 'org.openxmlformats.spreadsheet'
        });
      }

    } catch (error) {
      Alert.alert("Error", "Failed to export data. Please try again.");
      console.error("Export error:", error);
    } finally {
      setDownloading(false);
      setSharing(false);
    }
  };

  const renderLoadingOverlay = () => {
    if (loading || downloading || sharing) {
      return (
        <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary}
            animating={true}
          />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {loading ? 'Loading data...' : 
             downloading ? 'Saving file...' : 'Preparing share...'}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header with Profile */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={32} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              CCTV Dashboard
            </Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Device Status
          </Text>
          
          <Card style={styles.totalCard}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Total Devices
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {activeDevices + inactiveDevices}
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.statsRow}>
            <Card style={[styles.activeCard, { backgroundColor: '#E8F5E9' }]}>
              <Card.Content>
                <Text style={[styles.activeTitle, { color: '#2E7D32' }]}>
                  Active
                </Text>
                <Text style={[styles.activeValue, { color: '#2E7D32' }]}>
                  {activeDevices}
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.inactiveCard, { backgroundColor: '#FFEBEE' }]}>
              <Card.Content>
                <Text style={[styles.inactiveTitle, { color: '#C62828' }]}>
                  Inactive
                </Text>
                <Text style={[styles.inactiveValue, { color: '#C62828' }]}>
                  {inactiveDevices}
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>
          
          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => router.push("/add-camera")}
              style={styles.addButton}
              labelStyle={styles.buttonText}
            >
              Add Camera
            </Button>

            <Button
              mode="contained"
              icon="camera"
              onPress={() => router.push("/my-cameras")}
              style={[styles.myCamerasButton, { backgroundColor: theme.colors.secondary }]}
              labelStyle={styles.buttonText}
            >
              My Cameras
            </Button>
          </View>

          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              icon="map-marker"
              onPress={() => router.push("/nearby-cameras")}
              style={[styles.nearbyButton, { backgroundColor: theme.colors.tertiary }]}
              labelStyle={styles.darkButtonText}
            >
              Nearby Cameras
            </Button>
          </View>
        </View>

        {/* Data Export */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Data Export
          </Text>
          
          <Card style={styles.exportCard}>
            <Card.Content>
              <Text style={[styles.cardSubtitle, { color: theme.colors.onSurface }]}>
                {userData?.type === 'admin' ? 'Export all CCTV data' : 'Export your CCTV data'}
              </Text>
              
              <Button
                mode="contained"
                icon="download"
                onPress={() => handleDownloadExcel(true)}
                loading={downloading}
                disabled={downloading || sharing}
                style={styles.saveButton}
                labelStyle={styles.darkButtonText}
              >
                Save to Device
              </Button>
              
              <Button
                mode="outlined"
                icon="share"
                onPress={() => handleDownloadExcel(false)}
                loading={sharing}
                disabled={sharing || downloading}
                style={[styles.shareButton, { borderColor: theme.colors.primary }]}
                labelStyle={[styles.shareButtonText, { color: theme.colors.primary }]}
              >
                Share File
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      {renderLoadingOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profileButton: {
    padding: 8,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    fontSize: 20,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalCard: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    elevation: 3,
    marginBottom: 16,
  },
  activeCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 3,
    marginRight: 8,
  },
  inactiveCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 3,
    marginLeft: 8,
  },
  cardTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 28,
  },
  activeTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  activeValue: {
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 28,
  },
  inactiveTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inactiveValue: {
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 28,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#6200EE',
    marginRight: 8,
    elevation: 3,
  },
  myCamerasButton: {
    flex: 1,
    borderRadius: 8,
    marginLeft: 8,
    elevation: 3,
  },
  nearbyButton: {
    flex: 1,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  darkButtonText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  exportCard: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    elevation: 3,
  },
  saveButton: {
    borderRadius: 8,
    backgroundColor: '#6200EE',
    paddingVertical: 6,
  },
  shareButton: {
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 12,
  },
  shareButtonText: {
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});