"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const leftPhotos = [
  "/images/msa-real-login.jpg",
  "/images/msa-real-hero.jpg",
  "/images/msa-coaching-v2.png",
  "/images/msa-lessons-v2.png",
];

const rightPhotos = [
  "/images/msa-real-family.jpg",
  "/images/msa-session-v2.png",
  "/images/msa-lessons-v2.png",
  "/images/msa-coaching-v2.png",
];

export default function HomePhotoCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % leftPhotos.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const columnStyle = {
    position: "relative" as const,
    minHeight: 360,
    overflow: "hidden",
    background: "#111",
  };

  return (
    <section
      aria-label="Miami Skate Academy skaters and coaches"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
        padding: 10,
        background: "#111",
      }}
    >
      <div style={columnStyle}>
        {leftPhotos.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt="Miami Skate Academy skater or coach at the skatepark"
            fill
            priority={index === 0}
            sizes="(max-width: 700px) 50vw, 50vw"
            style={{
              objectFit: "cover",
              opacity: index === active ? 1 : 0,
              transition: "opacity 650ms ease",
            }}
          />
        ))}
      </div>
      <div style={columnStyle}>
        {rightPhotos.map((src, index) => (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt="Miami Skate Academy skaters and coaches together"
            fill
            priority={index === 0}
            sizes="(max-width: 700px) 50vw, 50vw"
            style={{
              objectFit: "cover",
              opacity: index === active ? 1 : 0,
              transition: "opacity 650ms ease",
            }}
          />
        ))}
      </div>
    </section>
  );
}
