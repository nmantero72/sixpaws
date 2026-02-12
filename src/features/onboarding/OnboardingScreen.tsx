import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import type { Dog } from "../../domain/Dog";

import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { setDog } from "../../services/storage";

type Props = {
  onComplete: (dog: Dog) => void;
};

export function OnboardingScreen({ onComplete }: Props) {
  const [dogName, setDogName] = useState("");

  const handleContinue = async () => {
    const trimmed = dogName.trim() || "Mi perro";

    const newDog: Dog = {
      id: uuidv4(),
      userId: "user_local_1", // de momento fijo
      name: trimmed,
    };

    await setDog(newDog);
    onComplete(newDog);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sixpaws</Text>
      <Text style={styles.subtitle}>Crea el perfil de tu perro</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del perro"
        value={dogName}
        onChangeText={setDogName}
      />

      <Button title="Continuar" onPress={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
  },
});
