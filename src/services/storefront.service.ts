import { apiClient } from './apiClient';

export type BannerLinkType = 'PRODUCT' | 'CATEGORY' | 'OFFERS';

export interface StorefrontBanner {
  id: string;
  badge_text?: string | null;
  title: string;
  highlight_text?: string | null;
  subtitle?: string | null;
  cta_text: string;
  payment_note?: string | null;
  image_url: string;
  storage_key: string;
  image_badge_text?: string | null;
  link_type: BannerLinkType;
  link_target?: string | null;
  position: number;
  is_active: boolean;
}

export interface FeaturedProductSummary {
  id: string;
  sku: string;
  name: string;
  base_price: string | number;
  is_combo: boolean;
  featured_order: number;
  category?: { id: string; name: string; slug: string } | null;
  images?: Array<{ url: string }>;
}

export const StorefrontService = {
  getConfig: async (): Promise<{
    banners: StorefrontBanner[];
    featured_products: FeaturedProductSummary[];
  }> => {
    const { data } = await apiClient.get('storefront/admin');
    return data;
  },

  requestBannerPresign: async (file: File) => {
    const { data } = await apiClient.post<{
      uploadUrl: string;
      publicUrl: string;
      storageKey: string;
    }>('storefront/banners/presign', {
      contentType: file.type,
      fileSize: file.size,
    });
    return data;
  },

  uploadBinaryToR2: async (uploadUrl: string, file: File) => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Error al subir imagen a Cloudflare R2 (HTTP ${res.status})`);
    }
  },

  createBanner: async (payload: Partial<StorefrontBanner>) => {
    const { data } = await apiClient.post('storefront/banners', payload);
    return data;
  },

  updateBanner: async (id: string, payload: Partial<StorefrontBanner>) => {
    const { data } = await apiClient.patch(`storefront/banners/${id}`, payload);
    return data;
  },

  deleteBanner: async (id: string) => {
    await apiClient.delete(`storefront/banners/${id}`);
  },

  syncFeaturedProducts: async (productIds: string[]) => {
    const { data } = await apiClient.put('storefront/featured-products', {
      product_ids: productIds,
    });
    return data;
  },
};