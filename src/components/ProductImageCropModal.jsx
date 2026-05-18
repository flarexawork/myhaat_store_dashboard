import React, { useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { FiMinus, FiPlus, FiX } from "react-icons/fi";
import ProductImage from "./ProductImage";
import {
  PRODUCT_IMAGE_DEFAULT_BACKGROUND,
  PRODUCT_IMAGE_TARGET_SIZE,
} from "../utils/productImage";
import {
  createCroppedProductImageFile,
  createCroppedProductImagePreviewUrl,
} from "../utils/cropImage";

const MAX_ZOOM = 3;
const PREVIEW_MODE_CROPPED = "cropped";
const PREVIEW_MODE_ORIGINAL = "original";

const getDefaultCropAreaSize = () => {
  if (typeof window === "undefined") {
    return 320;
  }

  const viewportWidth = Math.floor(window.visualViewport?.width || window.innerWidth);
  const viewportHeight = Math.floor(window.visualViewport?.height || window.innerHeight);

  if (viewportWidth < 640) {
    const widthLimitedSize = viewportWidth - 40;
    const heightLimitedSize = viewportHeight
      ? Math.floor(viewportHeight - 380)
      : widthLimitedSize;

    return Math.max(Math.min(widthLimitedSize, heightLimitedSize, 360), 190);
  }

  if (viewportWidth < 1024 && viewportHeight && viewportHeight < 520) {
    const widthLimitedSize = viewportWidth - 48;
    const heightLimitedSize = Math.floor(viewportHeight - 230);

    return Math.max(Math.min(widthLimitedSize, heightLimitedSize, 320), 160);
  }

  if (viewportWidth < 1024) {
    return 360;
  }

  return 420;
};

const getDynamicMinZoom = (cropSize, mediaSize) => {
  if (!cropSize?.width || !cropSize?.height || !mediaSize?.width || !mediaSize?.height) {
    return 1;
  }

  return clampValue(
    Math.min(
      cropSize.width / mediaSize.width,
      cropSize.height / mediaSize.height,
    ),
    0.05,
    1,
  );
};

const ProductImageCropModal = ({
  image,
  backgroundColor = PRODUCT_IMAGE_DEFAULT_BACKGROUND,
  onCancel,
  onConfirm,
  onSkip,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitMode, setSubmitMode] = useState("");
  const [previewMode, setPreviewMode] = useState(PREVIEW_MODE_CROPPED);
  const [cropAreaSize, setCropAreaSize] = useState(getDefaultCropAreaSize);
  const [cropSize, setCropSize] = useState(null);
  const [mediaSize, setMediaSize] = useState(null);
  const previewUrlRef = useRef("");
  const hasInitializedZoomRef = useRef(false);

  useEffect(() => {
    if (!image) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [image]);

  useEffect(() => {
    const handleResize = () => {
      setCropAreaSize(getDefaultCropAreaSize());
    };

    const visualViewport = window.visualViewport;

    window.addEventListener("resize", handleResize);
    visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMinZoom(1);
    setCroppedAreaPixels(null);
    setPreviewMode(PREVIEW_MODE_CROPPED);
    setSubmitMode("");
    setCropSize(null);
    setMediaSize(null);
    hasInitializedZoomRef.current = false;
  }, [image?.id]);

  useEffect(() => {
    const nextMinZoom = getDynamicMinZoom(cropSize, mediaSize);

    setMinZoom(nextMinZoom);
    setZoom((currentZoom) => {
      if (!hasInitializedZoomRef.current) {
        hasInitializedZoomRef.current = true;
        return nextMinZoom;
      }

      return clampValue(currentZoom, nextMinZoom, MAX_ZOOM);
    });
  }, [cropSize, mediaSize]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    if (!image?.url || !croppedAreaPixels) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
      setPreviewUrl("");
      return undefined;
    }

    const timerId = window.setTimeout(async () => {
      try {
        const nextPreviewUrl = await createCroppedProductImagePreviewUrl({
          imageSrc: image.url,
          croppedAreaPixels,
          backgroundColor,
        });

        if (!isCurrent) {
          URL.revokeObjectURL(nextPreviewUrl);
          return;
        }

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        previewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
      } catch {
        if (!isCurrent) {
          return;
        }

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = "";
        }

        setPreviewUrl("");
      }
    }, 120);

    return () => {
      isCurrent = false;
      window.clearTimeout(timerId);
    };
  }, [backgroundColor, croppedAreaPixels, image?.url]);

  const details = useMemo(() => {
    if (!image) {
      return [];
    }

    return [
      image.width && image.height
        ? `Original: ${image.width}x${image.height}px`
        : null,
      croppedAreaPixels
        ? `Selected crop: ${Math.round(croppedAreaPixels.width)}x${Math.round(croppedAreaPixels.height)}px`
        : null,
      `Output: ${PRODUCT_IMAGE_TARGET_SIZE}x${PRODUCT_IMAGE_TARGET_SIZE}px`,
    ].filter(Boolean);
  }, [croppedAreaPixels, image]);

  if (!image) {
    return null;
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    setSubmitMode(PREVIEW_MODE_CROPPED);

    try {
      const croppedFile = await createCroppedProductImageFile({
        imageSrc: image.url,
        croppedAreaPixels,
        fileName: image.name,
        backgroundColor,
      });

      await onConfirm(croppedFile);
    } finally {
      setSubmitMode("");
    }
  };

  const handleSkip = async () => {
    if (!image?.file) {
      return;
    }

    setSubmitMode(PREVIEW_MODE_ORIGINAL);

    try {
      await onSkip(image.file);
    } finally {
      setSubmitMode("");
    }
  };

  const activePreviewSource =
    previewMode === PREVIEW_MODE_ORIGINAL || !previewUrl
      ? image.url
      : previewUrl;

  return (
    <div className="product-crop-modal fixed inset-0 z-[99999] bg-black/80">
      <div className="product-crop-shell flex min-h-screen w-full items-stretch justify-center sm:items-center sm:p-4 lg:p-6">
        <div className="product-crop-panel flex min-h-screen w-full flex-col overflow-hidden bg-[#18243a] text-[#d0d2d6] sm:min-h-0 sm:max-h-[92vh] sm:max-w-[720px] sm:rounded-[28px] sm:border sm:border-slate-700 sm:shadow-2xl">
          <div className="product-crop-header sticky top-0 z-20 border-b border-slate-700 bg-[#18243a]/95 px-4 py-3 backdrop-blur sm:px-4 sm:py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-[11px] sm:tracking-[0.24em]">
                  Product Image Crop
                </p>
                <h2 className="product-crop-title mt-1 text-base font-semibold text-white sm:text-lg">
                  Adjust the square frame before upload
                </h2>
                <p className="product-crop-subtitle mt-1.5 text-xs text-slate-400 sm:mt-2 sm:text-xs">
                  Crop to a square or skip and keep the original image as-is.
                </p>
              </div>

              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-[#243554] text-slate-200 transition hover:bg-[#2d4366] sm:h-10 sm:w-10"
                onClick={onCancel}
                type="button"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div className="product-crop-body grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="product-crop-editor min-h-0 border-b border-slate-700 p-4 sm:px-4 sm:py-4 lg:border-b-0 lg:border-r lg:p-4">
              <div
                className="product-crop-canvas relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-700 sm:rounded-[24px]"
                style={{
                  aspectRatio: "1 / 1",
                  maxWidth: `min(100%, ${cropAreaSize}px)`,
                  maxHeight: "70vh",
                  backgroundColor,
                }}
              >
                <Cropper
                  aspect={1}
                  crop={crop}
                  cropSize={{
                    width: cropAreaSize,
                    height: cropAreaSize,
                  }}
                  cropShape="rect"
                  image={image.url}
                  minZoom={minZoom}
                  maxZoom={MAX_ZOOM}
                  objectFit="contain"
                  restrictPosition={false}
                  showGrid={false}
                  zoom={zoom}
                  zoomSpeed={0.05}
                  onCropChange={setCrop}
                  onCropComplete={(_, nextCroppedAreaPixels) => {
                    setCroppedAreaPixels(nextCroppedAreaPixels);
                  }}
                  onCropSizeChange={(nextCropSize) => {
                    setCropSize(nextCropSize);
                  }}
                  onMediaLoaded={(nextMediaSize) => {
                    setMediaSize(nextMediaSize);
                    setCrop({ x: 0, y: 0 });
                  }}
                  onZoomChange={(nextZoom) =>
                    setZoom((currentZoom) =>
                      clampValue(nextZoom, minZoom, MAX_ZOOM),
                    )
                  }
                />
              </div>

              <div className="product-crop-zoom mt-3 rounded-xl border border-slate-700 bg-[#101a2d] p-3 sm:mt-4 sm:rounded-2xl sm:p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">Zoom</span>
                  <span className="text-xs font-medium text-slate-400">
                    {zoom.toFixed(2)}x
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-2 sm:mt-3 sm:gap-2">
                  <button
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-[#1f2d44] transition hover:bg-[#293b5d] sm:h-11 sm:w-11"
                    onClick={() =>
                      setZoom((currentZoom) =>
                        clampValue(currentZoom - 0.1, minZoom, MAX_ZOOM),
                      )
                    }
                    type="button"
                  >
                    <FiMinus />
                  </button>
                  <input
                    aria-label="Zoom image"
                    className="product-crop-range h-10 w-full sm:h-11"
                    max={MAX_ZOOM}
                    min={minZoom}
                    onChange={(event) =>
                      setZoom(clampValue(Number(event.target.value), minZoom, MAX_ZOOM))
                    }
                    step={0.01}
                    type="range"
                    value={zoom}
                  />
                  <button
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-[#1f2d44] transition hover:bg-[#293b5d] sm:h-11 sm:w-11"
                    onClick={() =>
                      setZoom((currentZoom) =>
                        clampValue(currentZoom + 0.1, minZoom, MAX_ZOOM),
                      )
                    }
                    type="button"
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
            </div>

            <div className="product-crop-side min-h-0 space-y-3 overflow-y-auto p-4 pb-5 sm:space-y-4 sm:px-4 sm:pb-24 sm:pt-4 lg:p-4 lg:pb-4">
              <div className="rounded-xl border border-slate-700 bg-[#101a2d] p-3 sm:rounded-2xl sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Live Preview</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Preview the square crop or keep the original framing.
                    </p>
                  </div>
                  <div className="inline-flex self-start rounded-xl border border-slate-700 bg-[#162235] p-1 sm:self-auto">
                    <button
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        previewMode === PREVIEW_MODE_CROPPED
                          ? "bg-[#ff7a1a] text-white"
                          : "text-slate-300 hover:bg-[#22324f]"
                      }`}
                      onClick={() => setPreviewMode(PREVIEW_MODE_CROPPED)}
                      type="button"
                    >
                      Crop
                    </button>
                    <button
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        previewMode === PREVIEW_MODE_ORIGINAL
                          ? "bg-[#ff7a1a] text-white"
                          : "text-slate-300 hover:bg-[#22324f]"
                      }`}
                      onClick={() => setPreviewMode(PREVIEW_MODE_ORIGINAL)}
                      type="button"
                    >
                      Original
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-700 bg-[#162235] px-3 py-2 text-xs text-slate-300">
                  {previewMode === PREVIEW_MODE_CROPPED
                    ? "Selected mode: Crop to square"
                    : "Selected mode: Use original image"}
                </div>

                <div className="mt-4">
                  <ProductImage
                    alt={image.name}
                    className="product-crop-preview-image w-full rounded-2xl border border-slate-700 sm:rounded-[22px]"
                    imgStyle={{ backgroundColor }}
                    src={activePreviewSource}
                    style={{ backgroundColor }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#101a2d] p-3 sm:rounded-2xl sm:p-4">
                <p className="text-sm font-semibold text-white">Image Details</p>
                <div className="mt-3 space-y-2 text-xs text-slate-400">
                  {details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>

                {image.warnings?.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-xs text-amber-200">
                    {image.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="product-crop-footer sticky bottom-0 z-20 border-t border-slate-700 bg-[#18243a]/95 px-4 py-3 backdrop-blur sm:px-4 sm:py-4">
            <div className="product-crop-actions flex flex-col gap-2 sm:flex-col sm:gap-3">
              <button
                className="min-w-0 flex-1 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-[#22324f] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3"
                disabled={Boolean(submitMode)}
                onClick={onCancel}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-w-0 flex-1 rounded-xl border border-slate-500 bg-[#22324f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b3f61] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3"
                disabled={Boolean(submitMode) || !image?.file}
                onClick={handleSkip}
                type="button"
              >
                {submitMode === PREVIEW_MODE_ORIGINAL
                  ? "Saving..."
                  : "Skip & Use Original"}
              </button>
              <button
                className="min-w-0 flex-1 rounded-xl bg-[#ff7a1a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea680a] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3"
                disabled={Boolean(submitMode) || !croppedAreaPixels}
                onClick={handleSave}
                type="button"
              >
                {submitMode === PREVIEW_MODE_CROPPED ? "Saving..." : "Crop & Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

export default ProductImageCropModal;
