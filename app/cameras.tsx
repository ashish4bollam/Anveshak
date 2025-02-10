import { View, Text, Button } from "react-native";
import { router } from "expo-router";  // Use 'useRouter' hook


export default function CameraSelection() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Select Location & Radius</Text>
      <Button title="Go Back" onPress={() => router.back()} />
    </View>
  );
}
