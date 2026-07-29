import React, { useEffect, useRef } from 'react';

// Enhanced multi-layer 3D-like starfield with:
// - Depth layers (near / mid / far) with parallax
// - Glowing nebula gradient blobs
// - Dynamic particle trails
// - Responsive mouse parallax
export default function StarfieldCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let canvas = document.getElementById('canvas3d');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'canvas3d';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width  = (canvas.width  = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let mouse = { x: width / 2, y: height / 2 };
    let raf;

    // Three depth layers
    const layers = [
      { count: 80, speed: 0.08, size: 1,   alpha: 0.25, parallax: 0.012 },
      { count: 50, speed: 0.15, size: 1.5, alpha: 0.5,  parallax: 0.025 },
      { count: 25, speed: 0.25, size: 2.5, alpha: 0.8,  parallax: 0.04  },
    ];

    const particles = layers.flatMap(layer =>
      Array.from({ length: layer.count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        ox: 0, oy: 0,         // offset from mouse parallax
        vx: (Math.random() - 0.5) * layer.speed,
        vy: (Math.random() - 0.5) * layer.speed,
        radius: layer.size * (0.7 + Math.random() * 0.6),
        alpha: layer.alpha * (0.6 + Math.random() * 0.4),
        parallax: layer.parallax,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.02,
      }))
    );

    // Nebula blobs
    const nebulae = [
      { x: width * 0.2, y: height * 0.3, r: 300, color: 'rgba(59,130,246,0.04)' },
      { x: width * 0.8, y: height * 0.6, r: 280, color: 'rgba(168,85,247,0.03)' },
      { x: width * 0.5, y: height * 0.8, r: 250, color: 'rgba(20,184,166,0.03)' },
    ];

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onResize = () => {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw nebula blobs
      nebulae.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, n.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connection lines between close particles in top layer
      const topParticles = particles.slice(-25);
      for (let i = 0; i < topParticles.length; i++) {
        for (let j = i + 1; j < topParticles.length; j++) {
          const a = topParticles[i], b = topParticles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(a.x + a.ox, a.y + a.oy);
            ctx.lineTo(b.x + b.ox, b.y + b.oy);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += p.twinkleSpeed;

        if (p.x < 0) p.x = width;  if (p.x > width)  p.x = 0;
        if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

        // Smooth mouse parallax
        const tx = (mouse.x - width  / 2) * p.parallax;
        const ty = (mouse.y - height / 2) * p.parallax;
        p.ox += (tx - p.ox) * 0.06;
        p.oy += (ty - p.oy) * 0.06;

        const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.twinkle));
        const drawX = p.x + p.ox;
        const drawY = p.y + p.oy;

        ctx.beginPath();
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,200,255,${alpha})`;
        ctx.shadowBlur  = p.radius > 1.8 ? 12 : 6;
        ctx.shadowColor = p.radius > 1.8 ? 'rgba(140,170,255,0.9)' : 'rgba(100,140,255,0.5)';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      raf = requestAnimationFrame(draw);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
