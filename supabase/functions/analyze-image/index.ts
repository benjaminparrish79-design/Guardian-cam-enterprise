// =======================================================================
// SUPABASE EDGE FUNCTION: ANALYZE IMAGE WITH GEMINI 3.5 FLASH
// =======================================================================
//
// Deploy to Supabase using CLI:
//   supabase functions deploy analyze-image
//
// Required Secrets in Supabase project:
//   - GEMINI_API_KEY: Your Google Gemini API Key
//   - SUPABASE_URL: (Auto-provided by Supabase runtime)
//   - SUPABASE_SERVICE_ROLE_KEY: (Auto-provided by Supabase runtime)
// =======================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper for CORS preflight
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Convert ArrayBuffer to Base64 in Deno-friendly way
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, prompt, cameraId } = await req.json()

    if (!imageUrl) {
      throw new Error('Missing parameter: imageUrl is required')
    }

    // 1. Initialize Supabase Client using env variables
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2. Fetch the image to process it as inline raw bytes (multimodal input).
    // This bypasses any access restrictions Gemini might have on relative/private bucket URLs.
    let base64Image = '';
    let mimeType = 'image/jpeg';
    
    try {
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        const contentType = imageResponse.headers.get('content-type');
        if (contentType) {
          mimeType = contentType;
        }
        const buffer = await imageResponse.arrayBuffer();
        base64Image = arrayBufferToBase64(buffer);
      } else {
        console.warn(`Failed to fetch imageUrl directly: ${imageResponse.statusText}. Passing URL in prompt fallback.`);
      }
    } catch (fetchErr) {
      console.warn('Error fetching image data directly, falling back to prompt URL reference:', fetchErr);
    }

    // 3. Prepare the contents payload for Gemini 3.5 Flash
    const textPart = {
      text: `${prompt || 'Analyze this security surveillance frame.'}
Please evaluate this frame for any safety, operational, or physical security threat.
Formulate your response in JSON format matching this schema:
{
  "threatLevel": "low" | "medium" | "high" | "critical",
  "description": "Short security evaluation of what was found in the camera frame"
}`
    };

    const parts: any[] = [textPart];

    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType,
          data: base64Image
        }
      });
    } else {
      // Fallback if image bytes could not be fetched
      parts.push({
        text: `Image URL to analyze: ${imageUrl}`
      });
    }

    // 4. Call Gemini 3.5 Flash (the recommended model for multimodal Q&A)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set on the server environment.');
    }

    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';
    const response = await fetch(`${geminiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON result from Gemini safely
    let parsedResult = { threatLevel: 'low', description: 'Surveillance analysis complete.' };
    try {
      if (rawText) {
        parsedResult = JSON.parse(rawText);
      }
    } catch (parseErr) {
      console.warn('Failed to parse Gemini response as JSON, falling back to unstructured format.', parseErr);
      parsedResult = {
        threatLevel: rawText.toLowerCase().includes('critical') ? 'critical' 
                    : rawText.toLowerCase().includes('high') ? 'high'
                    : rawText.toLowerCase().includes('medium') ? 'medium' : 'low',
        description: rawText || 'AI analysis complete'
      };
    }

    // 5. Store the AI alert event in Supabase db (public.ai_events table)
    const { data: insertedData, error: dbError } = await supabase
      .from('ai_events')
      .insert({
        device_id: cameraId || null,
        image_url: imageUrl,
        prompt: prompt || 'Remote Security AI Threat Analysis',
        threat_level: parsedResult.threatLevel || 'low',
        description: parsedResult.description || 'Surveillance scan finished with no alerts.'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to log event to ai_events table:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        threatLevel: parsedResult.threatLevel,
        description: parsedResult.description,
        event: insertedData,
        geminiRaw: result 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (err: any) {
    console.error('Edge Function failed:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Unknown internal error' }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
