import { z } from "zod";

import { query } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../create-context";

const FACEPP_API_KEY = process.env.FACEPP_API_KEY?.trim();
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET?.trim();

console.log('[Backend INIT] API credentials loaded at:', new Date().toISOString());
console.log('[Backend INIT] API Key present:', !!FACEPP_API_KEY);
console.log('[Backend INIT] API Secret present:', !!FACEPP_API_SECRET);

// Face++ regional endpoints - try global endpoint first, then US
const FACEPP_ENDPOINTS = [
  'https://api.faceplusplus.com/facepp/v3/detect',
  'https://api-us.faceplusplus.com/facepp/v3/detect',
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type SkinType = 'Oily' | 'Dry' | 'Normal' | 'Combination' | 'Sensitive';

interface SurfaceTexture {
  texture: number;
  pores: number;
  oiliness: number;
  moisture: number;
}

interface PigmentationTone {
  spots: number;
  redness: number;
  darkCircles: number;
}

interface Clarity {
  acne: number;
  tearTrough: number;
}

interface AgingStructure {
  wrinkles: number;
  firmness: number;
  eyebags: number;
  droopyUpperEyelid: number;
  droopyLowerEyelid: number;
}



export const scansRouter = createTRPCRouter({
  analyze: protectedProcedure
    .input(
      z.object({
        imageUri: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log('[Backend] Analyzing image for user:', ctx.userId);
      console.log('[Backend] Image URI length:', input.imageUri.length);
      
      try {
        if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
          throw new Error('Face++ API credentials not configured');
        }

        console.log('[Backend] Preparing image for Face++ API');
        
        const imageBase64 = input.imageUri.includes('base64,') 
          ? input.imageUri.split('base64,')[1] 
          : input.imageUri;

        console.log('[Backend] Step 1: Detecting face with Face++');
        console.log('[Backend] Using API Key:', FACEPP_API_KEY ? `${FACEPP_API_KEY.substring(0, 8)}...${FACEPP_API_KEY.slice(-4)}` : 'NOT SET');
        console.log('[Backend] API Key length:', FACEPP_API_KEY?.length || 0);
        console.log('[Backend] Using API Secret:', FACEPP_API_SECRET ? `${FACEPP_API_SECRET.substring(0, 8)}...${FACEPP_API_SECRET.slice(-4)}` : 'NOT SET');
        console.log('[Backend] API Secret length:', FACEPP_API_SECRET?.length || 0);
        
        let detectData: any = null;
        let lastError: Error | null = null;
        
        // Try each endpoint until one works
        for (const endpoint of FACEPP_ENDPOINTS) {
          console.log('[Backend] Trying Face++ endpoint:', endpoint);
          
          const detectFormData = new FormData();
          detectFormData.append('api_key', FACEPP_API_KEY!);
          detectFormData.append('api_secret', FACEPP_API_SECRET!);
          detectFormData.append('image_base64', imageBase64);
          detectFormData.append('return_attributes', 'age,gender,emotion,beauty,skinstatus');

          try {
            const detectResponse = await fetch(endpoint, {
              method: 'POST',
              body: detectFormData,
            });

            const detectContentType = detectResponse.headers.get('content-type') || '';
            const detectText = await detectResponse.text();
            
            console.log('[Backend] Face++ endpoint:', endpoint);
            console.log('[Backend] Face++ detect status:', detectResponse.status);
            console.log('[Backend] Face++ detect content-type:', detectContentType);
            console.log('[Backend] Face++ detect raw response (first 1000 chars):', detectText.substring(0, 1000));
            
            // Check for HTML error pages
            if (detectText.trim().startsWith('<!') || detectText.trim().startsWith('<html')) {
              console.log('[Backend] Received HTML error page from', endpoint);
              console.log('[Backend] HTTP Status:', detectResponse.status);
              
              // Extract any error info from HTML if possible
              const titleMatch = detectText.match(/<title>([^<]+)<\/title>/i);
              const errorTitle = titleMatch ? titleMatch[1] : 'Unknown error';
              console.log('[Backend] HTML page title:', errorTitle);
              
              // If it's a 5xx error, wait and retry
              if (detectResponse.status >= 500) {
                console.log('[Backend] Server error, waiting 2 seconds before trying next endpoint...');
                await delay(2000);
              }
              
              lastError = new Error(`Face++ returned HTML error page (status ${detectResponse.status}): ${errorTitle}`);
              continue;
            }
            
            if (!detectContentType.includes('application/json')) {
              console.log('[Backend] Non-JSON response from', endpoint, '- trying next endpoint');
              lastError = new Error(`Non-JSON response from ${endpoint} (content-type: ${detectContentType})`);
              continue;
            }
            
            const parsedData = JSON.parse(detectText);
            
            // Check for API errors
            if (parsedData.error_message) {
              console.log('[Backend] API error from', endpoint, ':', parsedData.error_message);
              console.log('[Backend] Full error response:', JSON.stringify(parsedData, null, 2));
              lastError = new Error(parsedData.error_message);
              
              // If it's an auth error, try next endpoint
              if (parsedData.error_message.includes('AUTHORIZATION_ERROR') || 
                  parsedData.error_message.includes('AUTHENTICATION_ERROR') ||
                  parsedData.error_message.includes('Invalid API Key') ||
                  parsedData.error_message.includes('api_key') ||
                  parsedData.error_message.includes('api_secret')) {
                console.log('[Backend] Auth error detected, trying next endpoint...');
                continue;
              }
              // For other errors (like no face detected), throw immediately
              throw lastError;
            }
            
            // Success!
            detectData = parsedData;
            console.log('[Backend] Successfully connected to Face++ via:', endpoint);
            break;
            
          } catch (fetchError: any) {
            console.error('[Backend] Error with endpoint', endpoint, ':', fetchError.message);
            lastError = fetchError;
            continue;
          }
        }
        
        if (!detectData) {
          console.error('[Backend] All Face++ endpoints failed. Last error:', lastError?.message);
          
          // Provide more specific error messages
          const errorMsg = lastError?.message || 'Face++ API request failed';
          if (errorMsg.includes('HTML error page')) {
            throw new Error('Face++ service is temporarily unavailable. Please try again in a few moments.');
          } else if (errorMsg.includes('Non-JSON')) {
            throw new Error('Face++ API returned an unexpected response. The service may be experiencing issues.');
          } else if (errorMsg.includes('AUTHORIZATION_ERROR') || errorMsg.includes('AUTHENTICATION_ERROR') || errorMsg.includes('Invalid API') || errorMsg.includes('api_key') || errorMsg.includes('api_secret')) {
            throw new Error('Face++ API authentication failed. Please verify your API key and secret are correct and your account is active.');
          }
          throw new Error(errorMsg);
        }
        
        console.log('[Backend] Face++ detect response:', JSON.stringify(detectData, null, 2));

        if (detectData.error_message) {
          console.error('[Backend] Face++ detect error:', detectData.error_message);
          throw new Error(detectData.error_message);
        }

        if (!detectData.faces || detectData.faces.length === 0) {
          throw new Error('No face detected in the image');
        }

        const face = detectData.faces[0];
        const attributes = face.attributes;
        const skinStatus = attributes?.skinstatus || {};
        
        console.log('[Backend] Using skinstatus from detect API');
        console.log('[Backend] Skin status data:', JSON.stringify(skinStatus, null, 2));
        console.log('[Backend] Individual values:');
        console.log('[Backend] - pore:', skinStatus.pore);
        console.log('[Backend] - oily:', skinStatus.oily);
        console.log('[Backend] - moisture:', skinStatus.moisture);
        console.log('[Backend] - wrinkle:', skinStatus.wrinkle);
        console.log('[Backend] - health:', skinStatus.health);
        console.log('[Backend] - stain:', skinStatus.stain);
        console.log('[Backend] - acne:', skinStatus.acne);
        console.log('[Backend] - dark_circle:', skinStatus.dark_circle);
        

        
        const getValue = (obj: any): number | null => {
          if (!obj) return null;
          if (typeof obj === 'number') return obj;
          if (obj.value !== undefined && obj.value !== null) return obj.value;
          return null;
        };
        
        const normalizeScore = (value: number | undefined | null, max = 100, inverse = false, fallback = 50): number => {
          if (value === undefined || value === null || isNaN(value)) {
            return fallback;
          }
          const normalized = Math.min(Math.max((value / max) * 100, 0), 100);
          return Math.round(inverse ? 100 - normalized : normalized);
        };
        
        const surfaceTexture: SurfaceTexture = {
          texture: normalizeScore(getValue(skinStatus.health), 100, false, 75),
          pores: normalizeScore(getValue(skinStatus.pore), 100, true, 50),
          oiliness: normalizeScore(getValue(skinStatus.oily), 100, true, 50),
          moisture: normalizeScore(getValue(skinStatus.moisture), 100, false, 50),
        };

        const pigmentationTone: PigmentationTone = {
          spots: normalizeScore(getValue(skinStatus.stain), 100, true, 50),
          redness: normalizeScore(getValue(skinStatus.stain), 100, true, 50),
          darkCircles: normalizeScore(getValue(skinStatus.dark_circle), 100, true, 50),
        };

        const clarity: Clarity = {
          acne: normalizeScore(getValue(skinStatus.acne), 100, true, 50),
          tearTrough: normalizeScore(getValue(skinStatus.dark_circle), 100, true, 50),
        };

        const agingStructure: AgingStructure = {
          wrinkles: normalizeScore(getValue(skinStatus.wrinkle), 100, true, 50),
          firmness: normalizeScore(getValue(skinStatus.health), 100, false, 75),
          eyebags: normalizeScore(getValue(skinStatus.dark_circle), 100, true, 50),
          droopyUpperEyelid: normalizeScore(getValue(skinStatus.health), 100, false, 75),
          droopyLowerEyelid: normalizeScore(getValue(skinStatus.dark_circle), 100, true, 50),
        };

        const oilyValue = getValue(skinStatus.oily) || 50;
        const moistureValue = getValue(skinStatus.moisture) || 50;
        const acneValue = getValue(skinStatus.acne) || 0;
        
        let skinType: SkinType = 'Normal';
        if (oilyValue > 60) {
          skinType = 'Oily';
        } else if (moistureValue < 40) {
          skinType = 'Dry';
        } else if (oilyValue > 40 && moistureValue < 50) {
          skinType = 'Combination';
        } else if (acneValue > 50) {
          skinType = 'Sensitive';
        }

        const skinAge = attributes?.age?.value || Math.floor(Math.random() * 15) + 25;
        
        const smileProbability = attributes?.emotion?.happiness || 0;
        const radianceMultiplier = smileProbability > 80 ? 1.1 : 1.0;
        const hasRadianceBonus = radianceMultiplier > 1.0;
        
        const beautyScore = attributes?.beauty?.female_score || attributes?.beauty?.male_score || 70;
        const radianceScore = Math.min(beautyScore * radianceMultiplier, 100);
        
        const allScores = [
          ...Object.values(surfaceTexture),
          ...Object.values(pigmentationTone),
          ...Object.values(clarity),
          ...Object.values(agingStructure),
        ].filter(score => !isNaN(score) && score !== null && score !== undefined);
        
        const technicalScore = allScores.length > 0
          ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
          : 75;
        
        const finalScore = Math.round(technicalScore * 0.7 + radianceScore * 0.3);

        const result = {
          score: finalScore,
          skinAge,
          skinType,
          surfaceTexture,
          pigmentationTone,
          clarity,
          agingStructure,
          radianceScore: Math.round(radianceScore),
          hasRadianceBonus,
          smileProbability: smileProbability / 100,
        };
        
        console.log('[Backend] Analysis complete:', result);
        return result;
      } catch (error) {
        console.error('[Backend] Analysis error:', error);
        throw error;
      }
    }),

  save: protectedProcedure
    .input(
      z.object({
        score: z.number(),
        skinAge: z.number(),
        skinType: z.enum(['Oily', 'Dry', 'Normal', 'Combination', 'Sensitive']),
        surfaceTexture: z.object({
          texture: z.number(),
          pores: z.number(),
          oiliness: z.number(),
          moisture: z.number(),
        }),
        pigmentationTone: z.object({
          spots: z.number(),
          redness: z.number(),
          darkCircles: z.number(),
        }),
        clarity: z.object({
          acne: z.number(),
          tearTrough: z.number(),
        }),
        agingStructure: z.object({
          wrinkles: z.number(),
          firmness: z.number(),
          eyebags: z.number(),
          droopyUpperEyelid: z.number(),
          droopyLowerEyelid: z.number(),
        }),
        radianceScore: z.number(),
        hasRadianceBonus: z.boolean(),
        imageUri: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const scanId = `scan_${Date.now()}_${Math.random()}`;

      const result = await query(
        `INSERT INTO scans (
          id, user_id, score, skin_age, skin_type,
          surface_texture, pigmentation_tone, clarity, aging_structure,
          radiance_score, has_radiance_bonus, image_uri
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          scanId,
          ctx.userId,
          input.score,
          input.skinAge,
          input.skinType,
          JSON.stringify(input.surfaceTexture),
          JSON.stringify(input.pigmentationTone),
          JSON.stringify(input.clarity),
          JSON.stringify(input.agingStructure),
          input.radianceScore,
          input.hasRadianceBonus,
          input.imageUri,
        ]
      );

      const row = result.rows[0];
      const scan = {
        id: row.id,
        userId: row.user_id,
        score: row.score,
        skinAge: row.skin_age,
        skinType: row.skin_type as SkinType,
        surfaceTexture: row.surface_texture,
        pigmentationTone: row.pigmentation_tone,
        clarity: row.clarity,
        agingStructure: row.aging_structure,
        radianceScore: row.radiance_score,
        hasRadianceBonus: row.has_radiance_bonus,
        imageUri: row.image_uri,
        createdAt: row.created_at,
      };

      return { success: true, scan };
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const result = await query(
      `SELECT * FROM scans 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [ctx.userId]
    );

    const scans = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      score: row.score,
      skinAge: row.skin_age,
      skinType: row.skin_type as SkinType,
      surfaceTexture: row.surface_texture,
      pigmentationTone: row.pigmentation_tone,
      clarity: row.clarity,
      agingStructure: row.aging_structure,
      radianceScore: row.radiance_score,
      hasRadianceBonus: row.has_radiance_bonus,
      imageUri: row.image_uri,
      createdAt: row.created_at,
    }));

    return { scans };
  }),
});
