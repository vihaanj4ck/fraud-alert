"use client";

import Image from "next/image";
import { useState } from "react";

// Fallbacks when primary image fails (picsum.photos returns real images)
const FALLBACK_BY_CATEGORY = {
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&q=80&fm=jpg",
  fashion: "https://images.unsplash.com/photo-1445205170230-053b83012850?w=400&h=400&fit=crop&q=80&fm=jpg",
  "home-kitchen": "https://images.unsplash.com/photo-1556909114-f6e7ad7d8b2a?w=400&h=400&fit=crop&q=80&fm=jpg",
  beauty: "https://images.unsplash.com/photo-1596462509314-39f2c1513a1e?w=400&h=400&fit=crop&q=80&fm=jpg",
  books: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop&q=80&fm=jpg",
  sports: "https://images.unsplash.com/photo-1517649763962-0c623055013b?w=400&h=400&fit=crop&q=80&fm=jpg",
  toys: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop&q=80&fm=jpg",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop&q=80&fm=jpg",
  footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&q=80&fm=jpg",
  accessories: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80&fm=jpg",
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&q=80&fm=jpg";

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
