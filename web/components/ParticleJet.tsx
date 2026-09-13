// Ported unchanged from AeroGuard's components/ParticleJet.tsx, with "use client"
// added for Next.js App Router (uses canvas + refs/effects, browser-only).
"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const ParticleJet: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    // Color gradient stops
    const colors = [
      "#1e40af", // Blue 800
      "#3b82f6", // Blue 500
      "#60a5fa", // Blue 400
      "#f59e0b", // Amber 500 (transition)
      "#ef4444", // Red 500
      "#dc2626", // Red 600
    ];

    const createParticle = (): Particle => {
      // Spawn particles primarily from bottom left, angled up
      const startY = height + Math.random() * 100; // Start below screen
      const startX = Math.random() * (width * 0.5) - 100; // Start left side

      // Velocity vectors for diagonal movement (Up and Right)
      const speed = Math.random() * 3 + 2;
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.2; // -45 degrees with variance

      return {
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed * 2,
        vy: Math.sin(angle) * speed * 2,
        life: 0,
        maxLife: Math.random() * 100 + 100,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    };

    // Initialize some particles
    for (let i = 0; i < 200; i++) {
      const p = createParticle();
      // Scatter initial particles across the screen for immediate effect
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    const draw = () => {
      // Clear with trail effect
      ctx.fillStyle = "rgba(5, 5, 5, 0.2)"; // Use background color with opacity for trails
      ctx.fillRect(0, 0, width, height);

      // Add new particles
      if (particles.length < 800) {
        particles.push(createParticle());
        particles.push(createParticle());
        particles.push(createParticle());
      }

      // Update and draw
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Speed increases with life (acceleration)
        p.vx *= 1.005;
        p.vy *= 1.005;

        const progress = p.life / p.maxLife;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        // Dynamic color shifting based on speed/position
        // Faster/Higher = Redder (Hotter)
        if (p.x > width * 0.6) {
          ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0, 1 - progress)})`; // Red
        } else if (p.x > width * 0.4) {
          ctx.fillStyle = `rgba(245, 158, 11, ${Math.max(0, 1 - progress)})`; // Orange
        } else {
          ctx.fillStyle = `rgba(59, 130, 246, ${Math.max(0, 1 - progress)})`; // Blue
        }

        ctx.fill();

        // Reset dead particles
        if (p.life >= p.maxLife || p.x > width || p.y < 0) {
          particles[i] = createParticle();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default ParticleJet;
