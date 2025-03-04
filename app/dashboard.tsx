import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Card, Button, Avatar, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig"; 

export default function Dashboard() {
  const router = useRouter();
  const [activeDevices, setActiveDevices] = useState(0);
  const [inactiveDevices, setInactiveDevices] = useState(0);

  // Fetch data from Firestore when component mounts
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "cctv_cameras"));
        let activeCount = 0;
        let inactiveCount = 0;

        snapshot.forEach((doc) => {
          const device = doc.data();
          if (device.workingCondition === "Working") {
            activeCount++;
          } else if (device.workingCondition === "Not Working") {
            inactiveCount++;
          }
        });

        setActiveDevices(activeCount);
        setInactiveDevices(inactiveCount);
      } catch (error) {
        console.error("Error fetching devices: ", error);
      }
    };

    fetchDeviceData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("../profile")}>
          <Avatar.Icon size={50} icon="account" style={styles.avatar} />
        </TouchableOpacity>
        <Text style={styles.username}>profile</Text>
        <IconButton
          icon="magnify"
          size={30}
          iconColor="#fff"
          onPress={() => console.log("Search clicked")}
        />
      </View>

      <Text style={styles.title}>Dashboard</Text>

      <Card style={styles.card}>
        <Card.Title
          title="Total Registered Devices"
          titleStyle={styles.cardTitle}
          left={(props) => (
            <Avatar.Icon {...props} icon="video" style={styles.cardIcon} />
          )}
        />
        <Card.Content>
          <Text style={styles.cardValue}>{activeDevices + inactiveDevices}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Active Devices"
          titleStyle={styles.cardTitle}
          left={(props) => (
            <Avatar.Icon {...props} icon="check-circle" style={styles.cardIcon} />
          )}
        />
        <Card.Content>
          <Text style={styles.cardValue}>{activeDevices}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Inactive Devices"
          titleStyle={styles.cardTitle}
          left={(props) => (
            <Avatar.Icon {...props} icon="cancel" style={styles.cardIcon} />
          )}
        />
        <Card.Content>
          <Text style={styles.cardValue}>{inactiveDevices}</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          icon="plus"
          style={styles.button}
          onPress={() => router.push("/add-camera")}
        >
          Add Camera
        </Button>
        <Button
          mode="contained"
          icon="map-marker-radius"
          style={styles.button}
          onPress={() => router.push("../nearby-cameras")}
        >
          Show Cameras Nearby
        </Button>
      </View>

      <Text style={styles.footer}>
        An initiative by IIT Ropar Students {"\n"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#101218",
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  avatar: {
    backgroundColor: "#3A3F51",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
  },
  card: {
    marginBottom: 15,
    backgroundColor: "#1C1E2A",
    borderRadius: 12,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
  },
  cardIcon: {
    backgroundColor: "#4A90E2",
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00E676",
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    marginVertical: 10,
    backgroundColor: "#4A90E2",
  },
  footer: {
    textAlign: "center",
    color: "#bbbbbb",
    marginTop: 30,
    fontSize: 14,
  },
});