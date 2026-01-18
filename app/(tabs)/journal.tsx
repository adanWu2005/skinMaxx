import { Image } from "expo-image";
import { router } from "expo-router";
import { Calendar, TrendingUp, Trash2, SlidersHorizontal } from "lucide-react-native";
import { useState, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useScans } from "@/contexts/ScansContext";

type SortOrder = "newest" | "oldest" | "highest" | "lowest";

export default function JournalScreen() {
  const { scans, isLoading, deleteScan } = useScans();
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const sortedScans = useMemo(() => {
    const sorted = [...scans];
    switch (sortOrder) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "highest":
        return sorted.sort((a, b) => b.score - a.score);
      case "lowest":
        return sorted.sort((a, b) => a.score - b.score);
      default:
        return sorted;
    }
  }, [scans, sortOrder]);

  const handleDelete = (scanId: string, scanDate: string) => {
    Alert.alert(
      "Delete Scan",
      `Are you sure you want to delete this scan from ${scanDate}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScan(scanId);
            } catch (error) {
              console.error("Failed to delete scan:", error);
              Alert.alert("Error", "Failed to delete scan. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Skin Journal</Text>
              <Text style={styles.subtitle}>Track your progress over time</Text>
            </View>
            {scans.length > 0 && (
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            )}
          </View>

          {showFilters && scans.length > 0 && (
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    sortOrder === "newest" && styles.filterChipActive,
                  ]}
                  onPress={() => setSortOrder("newest")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortOrder === "newest" && styles.filterChipTextActive,
                    ]}
                  >
                    Newest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    sortOrder === "oldest" && styles.filterChipActive,
                  ]}
                  onPress={() => setSortOrder("oldest")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortOrder === "oldest" && styles.filterChipTextActive,
                    ]}
                  >
                    Oldest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    sortOrder === "highest" && styles.filterChipActive,
                  ]}
                  onPress={() => setSortOrder("highest")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortOrder === "highest" && styles.filterChipTextActive,
                    ]}
                  >
                    Highest Score
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    sortOrder === "lowest" && styles.filterChipActive,
                  ]}
                  onPress={() => setSortOrder("lowest")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortOrder === "lowest" && styles.filterChipTextActive,
                    ]}
                  >
                    Lowest Score
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
        ) : scans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color={Colors.dark.textTertiary} />
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyDescription}>
              Complete your first scan to start tracking your skin health
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {sortedScans.map((scan) => (
              <Pressable 
                key={scan.id} 
                style={styles.scanCard}
                onPress={() => router.push(`/scan-details?scanId=${scan.id}`)}
              >
                <Image
                  source={{ uri: scan.imageUri }}
                  style={styles.scanImage}
                  contentFit="cover"
                />
                <View style={styles.scanInfo}>
                  <View style={styles.scanHeader}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.scanDate}>
                        {new Date(scan.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                      <Text style={styles.scanTime}>
                        {new Date(scan.createdAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>
                    </View>
                    <View style={styles.headerActions}>
                      {scan.hasRadianceBonus && (
                        <View style={styles.bonusBadge}>
                          <Text style={styles.bonusText}>✨ Radiance</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          handleDelete(
                            scan.id,
                            new Date(scan.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          )
                        }
                      >
                        <Trash2 size={18} color={Colors.dark.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Overall Score</Text>
                    <Text style={styles.scoreValue}>{scan.score}</Text>
                  </View>

                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Skin Age:</Text>
                      <Text style={styles.detailValue}>{scan.skinAge} years</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Skin Type:</Text>
                      <Text style={styles.detailValue}>{scan.skinType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Radiance:</Text>
                      <Text style={styles.detailValue}>{scan.radianceScore}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {sortedScans.length > 1 && (
              <View style={styles.trendCard}>
                <TrendingUp size={24} color={Colors.dark.secondary} />
                <Text style={styles.trendText}>
                  {sortedScans.length} scans completed
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.dark.text,
  },
  filterChipTextActive: {
    color: Colors.dark.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.dark.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
    gap: 16,
  },
  scanCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  scanImage: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  scanInfo: {
    padding: 16,
  },
  scanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  dateContainer: {
    gap: 2,
  },
  scanDate: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.dark.text,
  },
  scanTime: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  bonusBadge: {
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  bonusText: {
    fontSize: 12,
    color: Colors.dark.secondary,
    fontWeight: "600" as const,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: Colors.dark.primary,
  },
  detailsContainer: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: "500" as const,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.dark.text,
  },
  trendCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginTop: 8,
  },
  trendText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "600" as const,
  },
});
