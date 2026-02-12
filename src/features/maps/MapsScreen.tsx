import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import type { WalkSummary, CommunitySummary } from "../../domain/types";
import { buildMyHistory30d } from "../../domain/communityAggregator";
import {
  recommendCells,
  computeHourScores,
  normalizeScores01,
} from "../../domain/mapsEngine";
import { getWalkSummaries, getCommunitySummary } from "../../services/storage";

type Row = { cellId: string; hour: number; score: number };
type HeaderItem = { type: "header"; key: "rec-header" | "active-header" };
type RowItem = { type: "row"; key: string; item: Row; index: number; section: "rec" | "active" };
type ListItem = HeaderItem | RowItem;

const THIRTY_DAYS_MS = 30 * 24 * 3600 * 1000;

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

  const myHistory30d = useMemo(() => buildMyHistory30d(walks, Date.now()), [walks]);

  const walksIn30dCount = useMemo(() => {
    const now = Date.now();
    const windowStart = now - THIRTY_DAYS_MS;
    return walks.filter((walk) => walk.startedAt >= windowStart).length;
  }, [walks]);


  const recommendedRows: Row[] = useMemo(() => {
    const rec = recommendCells({
      hour,
      my: myHistory30d,
      community,
      topN: 10,
      myLowThreshold: 120,
    });

    return normalizeScores01(rec);
  }, [hour, myHistory30d, community]);

  const activeZonesRows: Row[] = useMemo(() => {
    const scores = computeHourScores({
      hour,
      my: myHistory30d,
      community,
    });

    return normalizeScores01(scores).slice(0, 10);
  }, [hour, myHistory30d, community]);

  const bestHourToday = useMemo(() => {
    let bestHour = 0;
    let bestScore = -1;

    for (let candidateHour = 0; candidateHour <= 23; candidateHour += 1) {
      const normalized = normalizeScores01(
        computeHourScores({
          hour: candidateHour,
          my: myHistory30d,
          community,
        })
      );

      const topScore = normalized[0]?.score ?? 0;

      if (topScore > bestScore) {
        bestScore = topScore;
        bestHour = candidateHour;
      }
    }

    return bestHour;
  }, [myHistory30d, community]);

  const hasData = recommendedRows.length > 0 || activeZonesRows.length > 0;

  const listData: ListItem[] = [
    { type: "header", key: "rec-header" },
    ...recommendedRows.map((item, idx) => ({
      type: "row" as const,
      key: `rec-${item.cellId}-${item.hour}-${idx}`,
      item,
      index: idx,
      section: "rec" as const,
    })),
    { type: "header", key: "active-header" },
    ...activeZonesRows.map((item, idx) => ({
      type: "row" as const,
      key: `active-${item.cellId}-${item.hour}-${idx}`,
      item,
      index: idx,
      section: "active" as const,
    })),
  ];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
        Mapas (MVD)
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Pressable
          onPress={() => setHour((h) => (h + 23) % 24)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderRadius: 8,
          }}
        >
          <Text>-</Text>
        </Pressable>

        <Text style={{ fontSize: 16 }}>Hora: {hour}:00</Text>

        <Pressable
          onPress={() => setHour((h) => (h + 1) % 24)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderRadius: 8,
          }}
        >
          <Text>+</Text>
        </Pressable>
      </View>

      <Text style={{ marginBottom: 6 }}>
        Mejor hora hoy: {bestHourToday.toString().padStart(2, "0")}:00
      </Text>

      <Text style={{ marginBottom: 12 }}>
        Basado en tus últimos {walksIn30dCount} paseos (30 días)
      </Text>

      {!hasData ? (
        <Text>Aún no hay datos suficientes</Text>
      ) : (
        <FlatList<ListItem>
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    marginTop: item.key === "active-header" ? 14 : 0,
                    marginBottom: 8,
                  }}
                >
                  {item.key === "rec-header" ? "Recomendadas (poco visitadas)" : "Zonas más activas"}
                </Text>
              );
            }

            return (
              <View
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderColor: "#ddd",
                }}
              >
                <Text style={{ fontWeight: "600" }}>
                  {item.index + 1}. {item.item.cellId}
                </Text>
                <Text>score: {item.item.score.toFixed(2)}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
