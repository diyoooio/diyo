import React, { useState, useEffect } from 'react';

export const ThreeJSFlame: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      setTime((prev) => prev + 1);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const segments = 12;

  return (
    <div 
      className="relative w-72 h-72 flex items-center justify-center cursor-pointer select-none group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Dynamic ambient backlights */}
      <div 
        className="absolute w-48 h-48 bg-primary-container/20 rounded-full blur-[60px] transition-all duration-1000 group-hover:bg-primary-container/30"
        style={{
          transform: `scale(${1 + Math.sin(time * 0.03) * 0.1})`,
        }}
      />
      <div 
        className="absolute w-36 h-36 bg-secondary/15 rounded-full blur-[45px] transition-all duration-1000 group-hover:bg-secondary/25"
        style={{
          transform: `scale(${1 - Math.cos(time * 0.03) * 0.1})`,
        }}
      />

      {/* Orbiting Ring Vector Stack simulating the Torus Group */}
      <div className="relative w-full h-full flex items-center justify-center">
        {Array.from({ length: segments }).map((_, i) => {
          const factor = i / segments;
          const size = 180 * (1 - factor * 0.7); // larger at bottom, tapered at top
          const rotationOffset = factor * Math.PI * 2;
          const scaleOffset = 1 + Math.sin(time * 0.04 + i) * 0.12 * (hovered ? 1.5 : 1);
          const yPosition = (i * -12) + 50; // stack upward
          const opacity = 0.95 - factor * 0.6; // fade outward at top

          return (
            <div
              key={i}
              className="absolute rounded-full border-t-[3px] border-l-[1px] border-r-[1.5px] border-b-[0.5px] transition-colors duration-500"
              style={{
                width: `${size}px`,
                height: `${size * 0.16}px`, // extreme horizontal perspective squash
                borderColor: i % 2 === 0 ? 'rgba(255, 122, 24, 0.85)' : 'rgba(237, 193, 87, 0.9)',
                boxShadow: `0 0 16px ${i % 2 === 0 ? 'rgba(255, 122, 24, 0.65)' : 'rgba(237, 193, 87, 0.5)'}, inset 0 0 8px rgba(255,255,255,0.2)`,
                transform: `
                  translateY(${yPosition}px) 
                  rotateX(${65 + Math.sin(time * 0.01 + i * 0.1) * 5}deg) 
                  rotateZ(${time * 0.4 * (1 + factor * 0.5) + rotationOffset * 30}deg) 
                  scale(${scaleOffset})
                `,
                opacity: opacity,
                mixBlendMode: 'screen'
              }}
            />
          );
        })}

        {/* Central hot plasma flame core */}
        <div 
          className="absolute w-6 h-28 bg-gradient-to-t from-primary-container via-secondary to-transparent rounded-full filter blur-[10px] mix-blend-screen transition-all duration-500"
          style={{
            transform: `translateY(-20px) scaleY(${1.2 + Math.sin(time * 0.07) * 0.15})`,
            opacity: hovered ? 0.95 : 0.75
          }}
        />
        
        {/* Absolute needle center */}
        <div 
          className="absolute w-2 h-16 bg-white rounded-full filter blur-[2px] mix-blend-screen"
          style={{
            transform: `translateY(-15px) scaleY(${1 + Math.sin(time * 0.1) * 0.1})`,
            opacity: 0.85
          }}
        />
      </div>
    </div>
  );
};
