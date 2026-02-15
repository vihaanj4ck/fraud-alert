"use client";

import Image from "next/image";
import { useState } from "react";

// Fallbacks when primary image fails (picsum.photos returns real images)
const FALLBACK_BY_CATEGORY = {
  electronics: "https://picsum.photos/seed/electronics/400/400",
  fashion: "https://picsum.photos/seed/fashion/400/400",
  "home-kitchen": "https://picsum.photos/seed/home/400/400",
  beauty: "https://picsum.photos/seed/beauty/400/400",
  books: "https://picsum.photos/seed/books/400/400",
  sports: "https://picsum.photos/seed/sports/400/400",
  toys: "https://picsum.photos/seed/toys/400/400",
  grocery: "https://picsum.photos/seed/grocery/400/400",
  footwear: "https://picsum.photos/seed/footwear/400/400",
  accessories: "https://picsum.photos/seed/accessories/400/400",
};

const DEFAULT_FALLBACK = "https://picsum.photos/seed/product/400/400";

export default function ProductImage({ src, alt, categoryId, fill, className, sizes, priority }) {
  const [failed, setFailed] = useState(false);
  const fallbackSrc = (categoryId && FALLBACK_BY_CATEGORY[categoryId]) || DEFAULT_FALLBACK;
  const currentSrc = failed ? fallbackSrc : src;

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
