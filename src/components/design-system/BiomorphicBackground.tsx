import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';

interface BiomorphicBackgroundProps {
  intensity?: number; // 0-100, controls animation complexity
  color?: string;
  lowPowerMode?: boolean;
  className?: string;
}

/**
 * A nature-inspired animated background component that dynamically
 * adjusts its visual complexity based on device performance and
 * environmental considerations.
 */
const BiomorphicBackground: React.FC<BiomorphicBackgroundProps> = ({
  intensity = 50,
  color,
  lowPowerMode = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  // Calculate the number of particles based on intensity and power mode
  const getParticleCount = () => {
    const baseCount = Math.round((intensity / 100) * 40);
    return lowPowerMode ? Math.min(10, baseCount / 3) : baseCount;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Determine colors based on theme and props
    const baseColor = color || (theme === 'dark' ? '#145A32' : '#7DCEA0');

    // Create color variants
    const getColor = (opacity: number) => {
      const rgb = hexToRgb(baseColor);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    };

    // Generate biomorphic shapes
    const shapes: Array<{
      x: number;
      y: number;
      radius: number;
      xSpeed: number;
      ySpeed: number;
      growth: number;
      color: string;
    }> = [];

    const particleCount = getParticleCount();

    for (let i = 0; i < particleCount; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 50 + 10,
        xSpeed: (Math.random() - 0.5) * 0.5,
        ySpeed: (Math.random() - 0.5) * 0.5,
        growth: Math.random() * 0.1 - 0.05,
        color: getColor(Math.random() * 0.3 + 0.1)
      });
    }

    let animationFrameId: number;
    let lastFrameTime = 0;

    // Frame rate control for power saving
    const targetFPS = lowPowerMode ? 15 : 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTime;

      if (deltaTime > frameInterval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw biomorphic shapes
        shapes.forEach(shape => {
          // Update position
          shape.x += shape.xSpeed;
          shape.y += shape.ySpeed;

          // Update size with organic growth/shrink
          shape.radius += shape.growth;

          if (shape.radius > 70 || shape.radius < 10) {
            shape.growth *= -1;
          }

          // Boundary checks with edge wrapping
          if (shape.x < -shape.radius) shape.x = canvas.width + shape.radius;
          if (shape.x > canvas.width + shape.radius) shape.x = -shape.radius;
          if (shape.y < -shape.radius) shape.y = canvas.height + shape.radius;
          if (shape.y > canvas.height + shape.radius) shape.y = -shape.radius;

          // Draw organic blob
          ctx.beginPath();

          // Create irregular blob shape
          const bumpCount = 5;
          const bumpSize = shape.radius * 0.2;

          for (let i = 0; i <= 360; i++) {
            const angle = (i * Math.PI) / 180;

            // Create wavy edge effect
            const bumpFactor = 1 + Math.sin(angle * bumpCount) * (bumpSize / shape.radius);
            const x = shape.x + shape.radius * bumpFactor * Math.cos(angle);
            const y = shape.y + shape.radius * bumpFactor * Math.sin(angle);

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.closePath();
          ctx.fillStyle = shape.color;
          ctx.fill();
        });

        lastFrameTime = timestamp;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, color, lowPowerMode, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
};

// Helper function to convert hex to rgb
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

export default BiomorphicBackground;
