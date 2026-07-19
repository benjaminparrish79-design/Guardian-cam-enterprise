"use client";

import { useState } from "react";
import { Camera, CameraResultType } from "@capacitor/camera";
import { supabase } from "@/lib/supabase";

/**
 * Captures a photo using the device camera.
 * Returns the web path of the captured image.
 */
export async function capturePhoto() {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
  });
  return image.webPath;
}

/**
 * Converts a Capacitor image webPath into a standard browser Blob.
 * Necessary for uploading to Supabase Storage or custom backend APIs.
 */
export async function webPathToBlob(webPath: string): Promise<Blob> {
  const response = await fetch(webPath);
  return await response.blob();
}

/**
 * Helper to upload a Blob to Supabase Storage.
 * @param blob The image blob to upload.
 * @param bucket Name of the Supabase storage bucket (defaults to 'camera-uploads').
 * @returns The public URL of the uploaded image or throws an error.
 */
export async function uploadToSupabaseStorage(blob: Blob, bucket = "camera-uploads"): Promise<string> {
  const filename = `camera_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, blob, {
      contentType: "image/jpeg",
      cacheControl: "3600",
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

interface UseDeviceCameraResult {
  isCapturing: boolean;
  isUploading: boolean;
  error: string | null;
  takePhotoAndUpload: (bucketName?: string) => Promise<{ webPath?: string; publicUrl?: string }>;
}

/**
 * React Hook for interactive device camera capturing and Supabase uploading.
 */
export function useDeviceCamera(): UseDeviceCameraResult {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhotoAndUpload = async (bucketName = "camera-uploads") => {
    setIsCapturing(true);
    setIsUploading(false);
    setError(null);

    try {
      // 1. Capture the photo
      const webPath = await capturePhoto();
      
      if (!webPath) {
        throw new Error("No photo captured or operation was cancelled.");
      }

      setIsCapturing(false);
      setIsUploading(true);

      // 2. Convert to Blob
      const blob = await webPathToBlob(webPath);

      // 3. Upload to Supabase Storage
      const publicUrl = await uploadToSupabaseStorage(blob, bucketName);

      setIsUploading(false);
      return { webPath, publicUrl };
    } catch (err: any) {
      console.error("Camera hook failed:", err);
      const errMsg = err?.message || "Failed to capture or upload camera image.";
      setError(errMsg);
      setIsCapturing(false);
      setIsUploading(false);
      return { error: errMsg };
    }
  };

  return {
    isCapturing,
    isUploading,
    error,
    takePhotoAndUpload,
  };
}
