import React, { useRef, useState } from 'react';

/**
 * Reusable 3D Parallax Mouse Tilt Container
 * Applies smooth 3D Perspective rotation & sheen glare on hover.
 */
const TiltCard3D = ({ children, className = '', maxTilt = 12, scale = 1.02 }) => {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to card center (-1 to +1)
    const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
    const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

    const rotateX = -mouseY * maxTilt;
    const rotateY = mouseX * maxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.1s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
    });

    // 3D Glare sheen calculation
    const glareX = ((e.clientX - rect.left) / width) * 100;
    const glareY = ((e.clientY - rect.top) / height) * 100;
    setGlareStyle({
      opacity: 0.15,
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
    });
    setGlareStyle({ opacity: 0, transition: 'opacity 0.5s' });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d', ...style }}
      className={`relative overflow-hidden cursor-pointer ${className}`}
    >
      {children}
      {/* 3D Glare Sheen Overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={glareStyle}
      />
    </div>
  );
};

export default TiltCard3D;
