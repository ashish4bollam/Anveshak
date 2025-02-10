import { View, Text, Button, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const router = useRouter();

  const totalCameras = 100; // Replace with dynamic data
  const activeCameras = 80; // Replace with dynamic data

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Cameras Registered</Text>
        <Text style={styles.cardValue}>{totalCameras}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Cameras</Text>
        <Text style={styles.cardValue}>{activeCameras}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../profile")}
      >
        <Text style={styles.buttonText}>Go to Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../add-camera")}
      >
        <Text style={styles.buttonText}>Add Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../nearby-cameras")}
      >
        <Text style={styles.buttonText}>Show Cameras Nearby</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
