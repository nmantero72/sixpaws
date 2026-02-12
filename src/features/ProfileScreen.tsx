import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Dog } from "../domain/Dog";

type Props = {
  dog: Dog;
};

export function ProfileScreen({ dog }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil de {dog.name}</Text>
      <Text>ID: {dog.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, marginBottom: 10 }
});
