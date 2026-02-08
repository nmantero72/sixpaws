import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Dog } from "../domain/Dog";
import { OnboardingScreen } from "../features/onboarding/OnboardingScreen";
import { WalkScreen } from "../features/walk/WalkScreen";

export type RootStackParamList = {
  Onboarding: undefined;
  Walk: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigation() {
  const [dog, setDog] = useState<Dog | null>(null);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {dog ? (
          <Stack.Screen name="Walk" options={{ title: "Paseo" }}>
            {() => <WalkScreen dog={dog} />}
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
