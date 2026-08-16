"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const photos = [
  "/images/msa-real-login.jpg",
  "/images/msa-real-hero.jpg",
  "/images/msa-real-family.jpg",
  "/images/msa-coaching-v2.png",
  "/images/msa-session-v2.png",
  "/images/msa-lessons-v2.png",
];

export default function AuthPhotoCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % photos.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="auth-photo-carousel" aria-hidden="true">
      {photos.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={index === 0}
          sizes="100vw"
          className={index === active ? "active" : ""}
        />
      ))}
      <div className="auth-photo-wash" />
    </div>
  );
}
