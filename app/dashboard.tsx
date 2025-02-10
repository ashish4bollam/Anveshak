import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Dashboard() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Total Registered Cameras: 100</Text>
      <Button title="Select Camera Region" onPress={() => router.push("/cameras")} />
    </View>
  );
}
