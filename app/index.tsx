import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View, Text } from "react-native";

SplashScreen.preventAutoHideAsync(); // Keep splash screen visible

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate some loading
      SplashScreen.hideAsync(); // Hide splash screen
      router.replace("/login"); // Navigate to login
    };

    prepare();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading...</Text>
    </View>
  );
}
