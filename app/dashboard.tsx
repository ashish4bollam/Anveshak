import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, Avatar, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const router = useRouter();
  const totalCameras = 21159;
  const activeCameras = 21159;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar.Icon
          size={50}
          icon="account"
          style={styles.avatar}
          onPress={() => router.push("../profile")}
        />
        <Text style={styles.username}>raipursp</Text>
        <IconButton
          icon="magnify"
          size={30}
          color="#fff"
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
          <Text style={styles.cardValue}>{totalCameras}</Text>
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
          <Text style={styles.cardValue}>{activeCameras}</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          icon="plus"
          style={styles.button}
          onPress={() => router.push("../add-camera")}
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
        An initiative by Durg Range Police {"\n"} Conceptualized by Shri Ram
        Gopal Garg, IPS
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#101218", // Dark background to match the image
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  avatar: {
    backgroundColor: "#3A3F51", // Matching icon background color
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
    color: "#00E676", // Green color for values
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
