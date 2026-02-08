import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Dog } from "../../domain/Dog";

type Props = {
  dog: Dog;
};

export function WalkScreen({ dog }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paseo</Text>
      <Text style={styles.subtitle}>Perro: {dog.name}</Text>

      <View style={styles.card}>
        <Text>Tiempo: --</Text>
        <Text>Distancia: --</Text>
        <Text>Encuentros: --</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 16, opacity: 0.7 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
});
