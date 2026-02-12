import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { buildMyHistory30d } from '../../domain/communityAggregator';
import type { Dog } from '../../domain/Dog';
import type { Walk } from '../../domain/types';
import { buildWalkSummary } from '../../domain/walkSummaryBuilder';
import {
  appendWalkSummary,
  getWalkSummaries,
  setCommunitySummary,
} from '../../services/storage';
import type { RootStackParamList } from '../../ui/navigation';

type Props = {
  dog: Dog;
  navigation?: NativeStackNavigationProp<RootStackParamList>;
};

function createWalkId(): string {
  return `walk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function WalkScreen({ dog, navigation: navigationProp }: Props) {
  const navigationFromHook = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const navigation = navigationProp ?? navigationFromHook;

  const initialWalk = useMemo<Walk>(
    () => ({
      id: createWalkId(),
      dogId: dog.id,
      startedAt: Date.now(),
      points: [],
      encounters: [],
    }),
    [dog.id],
  );

  const [currentWalk, setCurrentWalk] = useState<Walk>(initialWalk);
  const [isSaving, setIsSaving] = useState(false);

  const onFinishWalk = async (): Promise<void> => {
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const endedAt = Date.now();
      const completedWalk: Walk = {
        ...currentWalk,
        endedAt,
      };

      const summary = buildWalkSummary(completedWalk);
      await appendWalkSummary(summary);

      const allSummaries = await getWalkSummaries();
      const myCommunitySummary = buildMyHistory30d(allSummaries, Date.now());
      await setCommunitySummary(myCommunitySummary);

      setCurrentWalk(completedWalk);

      const hour = new Date().getHours();
      const distanceKm = (summary.distanceM / 1000).toFixed(2);
      const durationMin = Math.round(summary.durationSec / 60);
      const rewardMessage = [
        `¡Gran paseo! +1 recompensa para ${dog.name}.`,
        `Distancia: ${distanceKm} km`,
        `Duración: ${durationMin} min`,
        `Saludos: ${summary.greetings} · Juegos: ${summary.plays}`,
        `Mapa actualizado para la hora ${hour}:00`,
      ].join('\n');

      Alert.alert('Paseo finalizado', rewardMessage, [
        {
          text: 'Volver al Perfil',
          style: 'cancel',
          onPress: () => navigation.navigate('Profile'),
        },
        {
          text: 'Ver Mapas',
          onPress: () => navigation.navigate('Maps'),
        },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el resumen del paseo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paseo</Text>
      <Text style={styles.subtitle}>Perro: {dog.name}</Text>

      <View style={styles.card}>
        <Text>Tiempo: --</Text>
        <Text>Distancia: --</Text>
        <Text>Encuentros: --</Text>
      </View>

      <Button
        title={isSaving ? 'Guardando...' : 'Finalizar paseo'}
        onPress={onFinishWalk}
        disabled={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 16, opacity: 0.7 },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
});
