import { Image } from "expo-image";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { X, Calendar, User, Droplets } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useScans } from "@/contexts/ScansContext";

export default function ScanDetailsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const { scans } = useScans();
  
  const scan = scans.find((s) => s.id === scanId);

  if (!scan) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.errorText}>Scan not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  const CategorySection = ({ title, items }: { title: string; items: { label: string; value: number }[] }) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <View style={styles.categoryItems}>
        {items.map((item, index) => (
          <View key={index} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <View style={styles.metricRight}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${item.value}%` }]} />
              </View>
              <Text style={styles.metricValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan Details</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image
            source={{ uri: scan.imageUri }}
            style={styles.image}
            contentFit="cover"
          />

          <View style={styles.overviewCard}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{scan.score}</Text>
              <Text style={styles.scoreLabel}>Overall Score</Text>
            </View>
            
            <View style={styles.overviewDetails}>
              <View style={styles.overviewItem}>
                <Calendar size={20} color={Colors.dark.primary} />
                <View>
                  <Text style={styles.overviewLabel}>Date</Text>
                  <Text style={styles.overviewValue}>
                    {new Date(scan.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <Text style={styles.overviewTime}>
                    {new Date(scan.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.overviewItem}>
                <User size={20} color={Colors.dark.primary} />
                <View>
                  <Text style={styles.overviewLabel}>Skin Age</Text>
                  <Text style={styles.overviewValue}>{scan.skinAge} years</Text>
                </View>
              </View>

              <View style={styles.overviewItem}>
                <Droplets size={20} color={Colors.dark.primary} />
                <View>
                  <Text style={styles.overviewLabel}>Skin Type</Text>
                  <Text style={styles.overviewValue}>{scan.skinType}</Text>
                </View>
              </View>
            </View>
          </View>

          {scan.hasRadianceBonus && (
            <View style={styles.radianceCard}>
              <Text style={styles.radianceEmoji}>✨</Text>
              <View style={styles.radianceContent}>
                <Text style={styles.radianceTitle}>Radiance Bonus</Text>
                <Text style={styles.radianceDescription}>
                  Your positive expression added a boost to your score!
                </Text>
                <Text style={styles.radianceScore}>+{scan.radianceScore} points</Text>
              </View>
            </View>
          )}

          <CategorySection
            title="Surface & Texture"
            items={[
              { label: "Texture", value: scan.surfaceTexture.texture },
              { label: "Pores", value: scan.surfaceTexture.pores },
              { label: "Oiliness", value: scan.surfaceTexture.oiliness },
              { label: "Moisture", value: scan.surfaceTexture.moisture },
            ]}
          />

          <CategorySection
            title="Pigmentation & Tone"
            items={[
              { label: "Spots", value: scan.pigmentationTone.spots },
              { label: "Redness", value: scan.pigmentationTone.redness },
              { label: "Dark Circles", value: scan.pigmentationTone.darkCircles },
            ]}
          />

          <CategorySection
            title="Clarity"
            items={[
              { label: "Acne", value: scan.clarity.acne },
              { label: "Tear Trough", value: scan.clarity.tearTrough },
            ]}
          />

          <CategorySection
            title="Aging & Structure"
            items={[
              { label: "Wrinkles", value: scan.agingStructure.wrinkles },
              { label: "Firmness", value: scan.agingStructure.firmness },
              { label: "Eyebags", value: scan.agingStructure.eyebags },
              { label: "Droopy Upper Eyelid", value: scan.agingStructure.droopyUpperEyelid },
              { label: "Droopy Lower Eyelid", value: scan.agingStructure.droopyLowerEyelid },
            ]}
          />
        </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.dark.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  overviewCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 24,
    gap: 24,
  },
  scoreCircle: {
    alignItems: "center",
    paddingVertical: 16,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: "700" as const,
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontWeight: "500" as const,
  },
  overviewDetails: {
    gap: 16,
  },
  overviewItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  overviewLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 2,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.dark.text,
  },
  overviewTime: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  radianceCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  radianceEmoji: {
    fontSize: 40,
  },
  radianceContent: {
    flex: 1,
    gap: 4,
  },
  radianceTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.dark.secondary,
  },
  radianceDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  radianceScore: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.dark.primary,
    marginTop: 4,
  },
  categorySection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 20,
    gap: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.dark.text,
  },
  categoryItems: {
    gap: 12,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  metricLabel: {
    fontSize: 15,
    color: Colors.dark.text,
    fontWeight: "500" as const,
    flex: 1,
  },
  metricRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 2,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.dark.primary,
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.dark.primary,
    minWidth: 32,
    textAlign: "right",
  },
  errorText: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: 100,
  },
});
