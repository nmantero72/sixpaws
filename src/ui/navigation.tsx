import React, { useEffect, useState } from "react";
import type { Dog } from "../domain/Dog";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text } from "react-native";

import { OnboardingScreen } from "../features/onboarding/OnboardingScreen";
import { ProfileScreen } from "../features/ProfileScreen";
import { MapsScreen } from "../features/maps/MapsScreen";
import { WalkScreen } from "../features/walk/WalkScreen";
import { getDog } from "../services/storage";

export type RootStackParamList = {
  Onboarding: undefined;
  Profile: undefined;
  Maps: undefined;
  Walk: { dogId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigation() {
  const [dog, setDog] = useState<Dog | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await getDog();
      if (saved) setDog(saved);
    })();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {dog ? (
          <Stack.Screen
            name="Profile"
            options={({ navigation }) => ({
              title: "Perfil",
              headerRight: () => (
                <Pressable onPress={() => navigation.navigate("Maps")}>
                  <Text>Mapas</Text>
                </Pressable>
              ),
            })}
          >
            {() => <ProfileScreen dog={dog} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Onboarding" options={{ title: "Onboarding" }}>
            {() => <OnboardingScreen onComplete={setDog} />}
          </Stack.Screen>
        )}
        <Stack.Screen name="Maps" component={MapsScreen} options={{ title: "Mapas" }} />
        <Stack.Screen name="Walk" component={WalkScreen} options={{ title: "Paseo" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
