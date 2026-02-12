import React, { useEffect, useState } from "react";
import type { Dog } from "../domain/Dog";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { OnboardingScreen } from "../features/onboarding/OnboardingScreen";
import { ProfileScreen } from "../features/ProfileScreen";
import { getDog } from "../services/storage";

export type RootStackParamList = {
  Onboarding: undefined;
  Profile: undefined;
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
          <Stack.Screen name="Profile" options={{ title: "Perfil" }}>
            {() => <ProfileScreen dog={dog} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Onboarding" options={{ title: "Onboarding" }}>
            {() => <OnboardingScreen onComplete={setDog} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
