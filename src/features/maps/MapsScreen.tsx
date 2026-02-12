import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import type { WalkSummary, CommunitySummary } from "../../domain/types";
import { buildMyHistory30d } from "../../domain/communityAggregator";
import { recommendCells, normalizeScores01 } from "../../domain/mapsEngine";
import { getWalkSummaries, getCommunitySummary } from "../../services/storage";

type Row = { cellId: string; hour: number; score: number };

export function MapsScreen() {
  const [hour, setHour] = useState<number>(new Date().getHours());
  const [walks, setWalks] = useState<WalkSummary[]>([]);
  const [community, setCommunity] = useState<CommunitySummary>({
    updatedAt: Date.now(),
    byCellHour: {},
  });

  useEffect(() => {
    (async () => {
      const ws = await getWalkSummaries();
      const cs = await getCommunitySummary();
      setWalks(ws);
      setCommunity(
        cs ?? {
          updatedAt: Date.now(),
          byCellHour: {},
        }
      );
    })();
  }, []);

  const rows: Row[] = useMemo(() => {
    const now = Date.now();
    const my = buildMyHistory30d(walks, now);
    const rec = recommendCells({
      hour,
      my,
      community,
      topN: 10,
      myLowThreshold: 120,
    });
    return normalizeScores01(rec);
  }, [hour, walks, community]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
        Mapas (MVD)
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Pressable
          onPress={() => setHour((h) => (h + 23) % 24)}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 }}
        >
          <Text>-</Text>
        </Pressable>

        <Text style={{ fontSize: 16 }}>Hora: {hour}:00</Text>

        <Pressable
          onPress={() => setHour((h) => (h + 1) % 24)}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 }}
        >
          <Text>+</Text>
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <Text>Aún no hay datos suficientes</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, idx) => `${item.cellId}|${item.hour}|${idx}`}
          renderItem={({ item, index }) => (
            <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: "#ddd" }}>
              <Text style={{ fontWeight: "600" }}>
                {index + 1}. {item.cellId}
              </Text>
              <Text>score: {item.score.toFixed(2)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
