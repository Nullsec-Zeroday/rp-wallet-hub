"use client";

import React from "react";
import { AVATAR_ICONS, AVATAR_IMAGES } from "@/lib/wallet-data";
import Image from "next/image";

interface AvatarProps {
  iconIndex: number;
  avatarType?: 'emoji' | 'image';
  size?: number;
  className?: string;
  fallback?: string;
}

export default function Avatar({ 
  iconIndex, 
  avatarType = 'emoji', 
  size = 44, 
  className = "",
  fallback = "🦊"
}: AvatarProps) {
  const isImage = avatarType === 'image';
  
  if (isImage) {
    const src = AVATAR_IMAGES[iconIndex] || AVATAR_IMAGES[0];
    return (
      <div 
        className={`relative overflow-hidden rounded-full flex-shrink-0 ${className}`}
        style={{ width: size, height: size, backgroundColor: "#2C2C2E" }}
      >
        <Image 
          src={src} 
          alt="Avatar" 
          fill
          className="object-cover"
        />
      </div>
    );
  }

  const emoji = AVATAR_ICONS[iconIndex] || fallback;
  return (
    <div 
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: "#2C2C2E",
        fontSize: Math.floor(size * 0.5) 
      }}
    >
      <span className="leading-none">{emoji}</span>
    </div>
  );
}
