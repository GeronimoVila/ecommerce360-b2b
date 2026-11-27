import { useEffect, useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Search,
  Star,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Package,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  StorefrontService,
  type StorefrontBanner,
  type BannerLinkType,
} from '../../../services/storefront.service';
import { apiClient } from '../../../services/apiClient';
import { optimizeImageToWebP } from '../../../utils/imageOptimizer';
import { CategoryService } from '../../../services/category.service';

interface CatalogOption {
  id: string;
  sku: string;
  name: string;
  base_price: string | number;
  is_combo: boolean;
  is_active: boolean;
  category?: { id: string; name: string; slug: string } | null;
  images?: Array<{ url: string; is_primary?: boolean }>;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  children?: CategoryOption[];
}

export default function StorefrontSettingsPage() {
  const [banners, setBanners] = useState<StorefrontBanner[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingFeatured, setSavingFeatured] = useState(false);

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [bannerForm, setBannerForm] = useState({
    badge_text: 'ESPECIAL TECNOLOGÍA SAN JUAN',
    title: '',
    highlight_text: 'Hasta 40% OFF',
    subtitle: 'Disfrutá lo último en tecnología. Pagá en cuotas sin interés con entrega prioritaria.',
    cta_text: 'Ver Promociones',
    payment_note: 'Visa, Mastercard & MP',
    image_badge_text: 'Ultra HD 4K HDR10+',
    link_type: 'OFFERS' as BannerLinkType,
    link_target: '',
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [configRes, productsRes, categoryTree] = await Promise.all([
        StorefrontService.getConfig(),
        apiClient.get('products/admin?limit=200'),
        CategoryService.getTree(false).catch(() => []),
      ]);

      setBanners(configRes.banners || []);
      setFeaturedIds((configRes.featured_products || []).map((p) => p.id));

      const activeProducts = (productsRes.data?.data || []).filter(
        (p: CatalogOption) => p.is_active
      );
      setCatalogProducts(activeProducts);

      const flatCats = CategoryService.flattenTree(categoryTree || []).map((item) => ({
        id: item.id,
        name: item.label,
        slug: item.node.slug,
      }));
      setCategories(flatCats);
    } catch {
      toast.error('Error cargando configuración de portada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      toast.warning('El título del banner es obligatorio.');
      return;
    }
    if (!bannerFile) {
      toast.warning('Debes seleccionar una imagen para el slide.');
      return;
    }
    if (
      (bannerForm.link_type === 'PRODUCT' || bannerForm.link_type === 'CATEGORY') &&
      !bannerForm.link_target
    ) {
      toast.warning('Selecciona el producto o categoría de destino.');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const optimizedFile = await optimizeImageToWebP(bannerFile);
      const { uploadUrl, publicUrl, storageKey } =
        await StorefrontService.requestBannerPresign(optimizedFile);

      await StorefrontService.uploadBinaryToR2(uploadUrl, optimizedFile);

      await StorefrontService.createBanner({
        ...bannerForm,
        image_url: publicUrl,
        storage_key: storageKey,
      });

      toast.success('Slide promocional publicado en la tienda.');
      setIsBannerModalOpen(false);
      setBannerFile(null);
      setBannerPreview('');
      setBannerForm({
        badge_text: 'ESPECIAL TECNOLOGÍA SAN JUAN',
        title: '',
        highlight_text: 'Hasta 40% OFF',
        subtitle:
          'Disfrutá lo último en tecnología. Pagá en cuotas sin interés con entrega prioritaria.',
        cta_text: 'Ver Promociones',
        payment_note: 'Visa, Mastercard & MP',
        image_badge_text: '',
        link_type: 'OFFERS',
        link_target: '',
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Error al crear el banner.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleToggleBannerActive = async (banner: StorefrontBanner) => {
    try {
      await StorefrontService.updateBanner(banner.id, { is_active: !banner.is_active });
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      );
      toast.success(banner.is_active ? 'Banner pausado.' : 'Banner activado.');
    } catch {
      toast.error('No se pudo actualizar el estado del banner.');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await StorefrontService.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success('Banner eliminado.');
    } catch {
      toast.error('Error al eliminar el banner.');
    }
  };

  const toggleFeaturedProduct = (productId: string) => {
    setFeaturedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const moveFeatured = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= featuredIds.length) return;
    const copy = [...featuredIds];
    const [removed] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, removed);
    setFeaturedIds(copy);
  };

  const handleSaveFeatured = async () => {
    setSavingFeatured(true);
    try {
      await StorefrontService.syncFeaturedProducts(featuredIds);
      toast.success('Productos destacados actualizados en la tienda B2C.');
    } catch {
      toast.error('Error al guardar productos destacados.');
    } finally {
      setSavingFeatured(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const featuredObjects = featuredIds
    .map((id) => catalogProducts.find((p) => p.id === id))
    .filter((p): p is CatalogOption => Boolean(p));

  const filteredCatalog = catalogProducts.filter((p) => {
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Vidriera y Portada B2C
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurá los banners promocionales del carrusel y los productos/combos destacados de la semana.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsBannerModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Banner Carrusel
        </button>
      </div>
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Slides del Carrusel Principal ({banners.length})
            </h2>
            <p className="text-xs text-slate-500">
              Al hacer clic en un slide en la tienda, el cliente navega directo al producto, combo o categoría elegida.
            </p>
          </div>
        </div>

        {banners.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Aún no cargaste banners promocionales
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Subí una foto promocional para mostrar ofertas destacadas en la parte superior de la tienda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-28 h-20 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {banner.badge_text && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {banner.badge_text}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          banner.is_active
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {banner.is_active ? 'Activo' : 'Pausado'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {banner.title}{' '}
                      {banner.highlight_text && (
                        <span className="text-indigo-600">{banner.highlight_text}</span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3" />
                      Destino:{' '}
                      <strong className="text-slate-700">
                        {banner.link_type === 'PRODUCT'
                          ? 'Producto / Combo específico'
                          : banner.link_type === 'CATEGORY'
                          ? `Categoría (${banner.link_target})`
                          : 'Todas las Ofertas'}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleToggleBannerActive(banner)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    {banner.is_active ? 'Pausar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              Ofertas Destacadas de la Semana ({featuredObjects.length} seleccionados)
            </h2>
            <p className="text-xs text-slate-500">
              Elegí qué productos y combos aparecen en la grilla principal de la portada y definí su orden.
            </p>
          </div>
          <button
            onClick={handleSaveFeatured}
            disabled={savingFeatured}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {savingFeatured ? 'Guardando...' : 'Publicar Selección'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="lg:col-span-6 p-5 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar producto o combo por nombre o SKU..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {filteredCatalog.map((item) => {
                const isSelected = featuredIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between gap-3 p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFeaturedProduct(item.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.is_combo ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                              <Layers className="w-2.5 h-2.5" /> COMBO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              <Package className="w-2.5 h-2.5" /> SKU
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">{item.sku}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                          {item.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 shrink-0">
                      ${Number(item.base_price).toLocaleString('es-AR')}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-6 p-5 space-y-3 bg-slate-50/40">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Orden en Portada (Arrastrá o usá las flechas)
            </p>

            {featuredObjects.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                Si no seleccionás ninguno, la tienda mostrará automáticamente los últimos productos y combos activos.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {featuredObjects.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.is_combo ? 'Combo Ahorro' : item.category?.name || 'Producto'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveFeatured(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFeatured(idx, 1)}
                        disabled={idx === featuredObjects.length - 1}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFeaturedProduct(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      {isBannerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Nuevo Slide Promocional</h3>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Badge Superior
                  </label>
                  <input
                    type="text"
                    value={bannerForm.badge_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge_text: e.target.value })}
                    placeholder="Ej: ESPECIAL TECNOLOGÍA SAN JUAN"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Etiqueta sobre la Foto
                  </label>
                  <input
                    type="text"
                    value={bannerForm.image_badge_text}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, image_badge_text: e.target.value })
                    }
                    placeholder="Ej: Ultra HD 4K HDR10+"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Título Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="Ej: Renová tu Tecnología con"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Texto Destacado en Azul
                  </label>
                  <input
                    type="text"
                    value={bannerForm.highlight_text}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, highlight_text: e.target.value })
                    }
                    placeholder="Ej: Hasta 40% OFF"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Descripción / Subtítulo
                  </label>
                  <textarea
                    rows={2}
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={bannerForm.cta_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, cta_text: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Al hacer clic, ir a:
                  </label>
                  <select
                    value={bannerForm.link_type}
                    onChange={(e) =>
                      setBannerForm({
                        ...bannerForm,
                        link_type: e.target.value as BannerLinkType,
                        link_target: '',
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="OFFERS">Ofertas Destacadas</option>
                    <option value="PRODUCT">Un Producto o Combo específico</option>
                    <option value="CATEGORY">Una Categoría en oferta</option>
                  </select>
                </div>

                {bannerForm.link_type === 'PRODUCT' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Seleccionar Producto o Combo *
                    </label>
                    <select
                      required
                      value={bannerForm.link_target}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, link_target: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    >
                      <option value="">-- Elegir producto/combo --</option>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.is_combo ? '[COMBO] ' : ''}
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {bannerForm.link_type === 'CATEGORY' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Seleccionar Categoría *
                    </label>
                    <select
                      required
                      value={bannerForm.link_target}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, link_target: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    >
                      <option value="">-- Elegir categoría --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Imagen Promocional (JPG, PNG o WebP) *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {bannerPreview && (
                    <img
                      src={bannerPreview}
                      alt="Preview"
                      className="mt-3 w-full h-44 object-cover rounded-xl border border-slate-200"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploadingBanner}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
                >
                  {isUploadingBanner ? 'Subiendo y guardando...' : 'Publicar Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}