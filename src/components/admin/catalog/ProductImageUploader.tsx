import { useRef, useState } from 'react';
import {
  ImagePlus,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { optimizeImageToWebP } from '../../../utils/imageOptimizer';
import { MediaService } from '../../../services/media.service';
import type { ProductImage } from '../../../types/product';

interface ProductImageUploaderProps {
  images: ProductImage[];
  productName: string;
  onChange: (images: ProductImage[]) => void;
  onDraftUploaded?: (imageId: string) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  maxImages?: number;
}

export const ProductImageUploader = ({
  images,
  productName,
  onChange,
  onDraftUploaded,
  onUploadingChange,
  maxImages = 8,
}: ProductImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateUploadingCounter = (delta: number) => {
    setUploadingCount((prev) => {
      const next = Math.max(0, prev + delta);
      onUploadingChange?.(next > 0);
      return next;
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);

    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      setUploadError(`Ya alcanzaste el límite máximo de ${maxImages} imágenes por producto.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);
    if (fileList.length > availableSlots) {
      setUploadError(`Solo se procesaron ${availableSlots} imágenes para respetar el máximo de ${maxImages}.`);
    }

    updateUploadingCounter(filesToProcess.length);

    const uploadedBatch: ProductImage[] = [];

    for (const rawFile of filesToProcess) {
      try {
        const webpFile = await optimizeImageToWebP(rawFile);
        const presigned = await MediaService.requestPresignedUpload(
          webpFile,
          productName || rawFile.name
        );
        await MediaService.uploadBinaryToR2(presigned.uploadUrl, webpFile);

        onDraftUploaded?.(presigned.imageId);

        uploadedBatch.push({
          id: presigned.imageId,
          url: presigned.publicUrl,
          alt_text: productName || null,
          position: 0,
          is_primary: false,
        });
      } catch (err: any) {
        console.error('[ProductImageUploader] Error subiendo imagen:', err);
        setUploadError(
          err?.response?.data?.error || err?.message || 'Error al subir una de las imágenes a R2.'
        );
      } finally {
        updateUploadingCounter(-1);
      }
    }

    if (uploadedBatch.length > 0) {
      const merged = [...images, ...uploadedBatch];
      const hasPrimary = merged.some((img) => img.is_primary);
      const normalized = merged.map((img, idx) => ({
        ...img,
        position: idx,
        is_primary: hasPrimary ? img.is_primary : idx === 0,
      }));
      onChange(normalized);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetPrimary = (targetId: string) => {
    const updated = images.map((img) => ({
      ...img,
      is_primary: img.id === targetId,
    }));
    onChange(updated);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    onChange(copy.map((img, idx) => ({ ...img, position: idx })));
  };

  const handleRemove = (targetId: string) => {
    const filtered = images.filter((img) => img.id !== targetId);
    if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
      filtered[0] = { ...filtered[0], is_primary: true };
    }
    onChange(filtered.map((img, idx) => ({ ...img, position: idx })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Galería de Imágenes ({images.length}/{maxImages})
        </label>
        <span className="text-[11px] text-slate-400">
          Optimización automática a WebP · Máx. 5 MB por archivo
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => images.length < maxImages && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#5B50D6] bg-[#5B50D6]/5'
            : images.length >= maxImages
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            : 'border-slate-200 hover:border-[#5B50D6]/60 hover:bg-slate-50/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={images.length >= maxImages}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {uploadingCount > 0 ? (
          <div className="flex flex-col items-center justify-center py-2 gap-2">
            <Loader2 className="w-7 h-7 text-[#5B50D6] animate-spin" />
            <p className="text-sm font-semibold text-slate-700">
              Comprimiendo y subiendo {uploadingCount}{' '}
              {uploadingCount === 1 ? 'imagen' : 'imágenes'} a R2...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1 gap-1.5">
            <div className="p-2.5 bg-[#5B50D6]/10 text-[#5B50D6] rounded-xl">
              <ImagePlus className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Arrastra tus fotos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-slate-400">
              JPG, PNG o WebP. La foto marcada con estrella será la portada en la tienda.
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`group relative rounded-xl overflow-hidden border bg-slate-50 aspect-square shadow-sm transition-all ${
                img.is_primary
                  ? 'border-[#5B50D6] ring-2 ring-[#5B50D6]/20'
                  : 'border-slate-200'
              }`}
            >
              <img
                src={img.url}
                alt={img.alt_text || `Vista ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {img.is_primary && (
                <span className="absolute top-2 left-2 bg-[#5B50D6] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Portada
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-900/80 via-slate-900/40 to-transparent p-2 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    title="Mover a la izquierda"
                    className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded-md disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === images.length - 1}
                    title="Mover a la derecha"
                    className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded-md disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      title="Establecer como portada"
                      className="p-1 bg-white/90 hover:bg-amber-400 hover:text-white text-slate-800 rounded-md transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(img.id)}
                    title="Quitar imagen"
                    className="p-1 bg-white/90 hover:bg-rose-600 hover:text-white text-rose-600 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};