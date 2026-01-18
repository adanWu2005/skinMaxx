import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useState } from "react";
import { Platform } from 'react-native';

import createContextHook from "@nkzw/create-context-hook";

import { trpc } from '@/lib/trpc';

export type SkinType = 'Oily' | 'Dry' | 'Normal' | 'Combination' | 'Sensitive';

export interface SurfaceTexture {
  texture: number;
  pores: number;
  oiliness: number;
  moisture: number;
}

export interface PigmentationTone {
  spots: number;
  redness: number;
  darkCircles: number;
}

export interface Clarity {
  acne: number;
  tearTrough: number;
}

export interface AgingStructure {
  wrinkles: number;
  firmness: number;
  eyebags: number;
  droopyUpperEyelid: number;
  droopyLowerEyelid: number;
}

export interface Scan {
  id: string;
  userId: string;
  score: number;
  skinAge: number;
  skinType: SkinType;
  surfaceTexture: SurfaceTexture;
  pigmentationTone: PigmentationTone;
  clarity: Clarity;
  agingStructure: AgingStructure;
  radianceScore: number;
  hasRadianceBonus: boolean;
  imageUri: string;
  createdAt: string;
}

const SCANS_STORAGE_KEY = "skinmaxx_scans";

export const [ScansProvider, useScans] = createContextHook(() => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadScans = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SCANS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setScans(parsed);
      }
    } catch (error) {
      console.error("Failed to load scans:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const analyzeMutation = trpc.scans.analyze.useMutation();

  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    console.log('[ScansContext] Converting image to base64:', imageUri.substring(0, 50));
    
    if (imageUri.startsWith('data:image')) {
      return imageUri;
    }

    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      return `data:image/jpeg;base64,${base64}`;
    }
  };

  const analyzeScan = useCallback(async (imageUri: string, retryCount = 0) => {
    console.log("[ScansContext] Analyzing image:", imageUri.substring(0, 50));

    try {
      const base64Image = await convertImageToBase64(imageUri);
      console.log('[ScansContext] Image converted to base64, length:', base64Image.length);
      
      const result = await analyzeMutation.mutateAsync({
        imageUri: base64Image,
      });

      console.log('[ScansContext] Analysis result:', result);
      return result;
    } catch (error: any) {
      console.error('[ScansContext] Analysis error:', error);
      
      const errorMessage = error?.message || '';
      const isJsonParseError = errorMessage.includes('JSON Parse') || errorMessage.includes('Unexpected character');
      
      if (isJsonParseError && retryCount === 0) {
        console.log('[ScansContext] JSON parse error detected, retrying once...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return analyzeScan(imageUri, 1);
      }
      
      throw error;
    }
  }, [analyzeMutation]);

  const saveScan = useCallback(
    async (scanData: Omit<Scan, "id" | "createdAt">) => {
      try {
        const newScan: Scan = {
          ...scanData,
          id: `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          createdAt: new Date().toISOString(),
        };

        const updatedScans = [newScan, ...scans];
        setScans(updatedScans);

        await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updatedScans));
        console.log("[Local] Scan saved successfully:", newScan.id);

        return { success: true, scan: newScan };
      } catch (error) {
        console.error("[Local] Failed to save scan:", error);
        throw error;
      }
    },
    [scans]
  );

  const deleteScan = useCallback(
    async (scanId: string) => {
      try {
        const updatedScans = scans.filter((s) => s.id !== scanId);
        setScans(updatedScans);
        await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updatedScans));
        console.log("[Local] Scan deleted:", scanId);
      } catch (error) {
        console.error("[Local] Failed to delete scan:", error);
        throw error;
      }
    },
    [scans]
  );

  return {
    scans,
    isLoading,
    analyzeScan,
    saveScan,
    deleteScan,
  };
});
