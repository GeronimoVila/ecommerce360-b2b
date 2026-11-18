import { apiClient } from './apiClient';
import type { ProductImage } from '../types/product';

export interface PresignResponse {
  imageId: string;
  uploadUrl: string;
  publicUrl: string;
  storageKey: string;
}

export const MediaService = {
  requestPresignedUpload: async (file: File, altText?: string): Promise<PresignResponse> => {
    const response = await apiClient.post<PresignResponse>('media/presign', {
      contentType: file.type,
      fileSize: file.size,
      altText,
    });
    return response.data;
  },

  uploadBinaryToR2: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Cloudflare R2 rechazó la subida (HTTP ${response.status}).`);
    }
  },

  syncProductImages: async (
    productId: string,
    images: Array<{ id: string; alt_text?: string | null; is_primary?: boolean }>
  ): Promise<ProductImage[]> => {
    const response = await apiClient.patch<{ images: ProductImage[] }>(
      `media/product/${productId}/sync`,
      { images }
    );
    return response.data.images;
  },

  deleteImage: async (imageId: string): Promise<void> => {
    await apiClient.delete(`media/${imageId}`);
  },
};