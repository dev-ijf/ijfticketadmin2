"use client";

import { useState, useEffect } from "react";

interface DynamicLogoProps {
  src: string;
  alt: string;
  maxWidth?: number;
  maxHeight?: number;
  fallbackSrc?: string;
  className?: string;
  priority?: boolean;
}

export function DynamicLogo({
  src,
  alt,
  maxWidth = 64,
  maxHeight = 64,
  fallbackSrc = "/logo-main-new.png",
  className = "",
  priority = false,
}: DynamicLogoProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Update imgSrc when src prop changes
  useEffect(() => {
    if (src !== imgSrc && !hasError) {
      console.log(
        "🖼️ DynamicLogo: Updating image source from",
        imgSrc,
        "to",
        src,
      );
      setImgSrc(src);
      setIsLoading(true);
    }
  }, [src, imgSrc, hasError]);

  const handleError = () => {
    console.error("❌ DynamicLogo: Failed to load image:", imgSrc);
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      console.log("🔄 DynamicLogo: Falling back to default:", fallbackSrc);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log("✅ DynamicLogo: Image loaded successfully:", imgSrc);
    setHasError(false);
    setIsLoading(false);
  };

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: maxWidth,
        height: maxHeight,
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className="w-auto h-auto object-contain transition-opacity duration-300"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          aspectRatio: "auto",
          opacity: isLoading ? 0 : 1,
        }}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}

export default DynamicLogo;
