// src/components/BrandName.jsx
import React from "react";

export default function BrandName({ as: Tag = "span", className = "" }) {
  return <Tag className={`brand-cursive ${className}`}>Candle Love</Tag>;
}
