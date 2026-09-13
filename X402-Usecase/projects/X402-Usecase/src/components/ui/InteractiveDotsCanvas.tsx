import React, { useEffect, useRef } from 'react';

interface InteractiveDotsCanvasProps {
  dotSpacing?: number;
  dotRadius?: number;
  interactiveRadius?: number;
  particleCount?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: string;
  glowColor: string;
  pulseSpeed: number;
  pulseOffset: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface PulsePacket {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  color: string;
}

export function InteractiveDotsCanvas({
  dotSpacing = 28,
  dotRadius = 1.2,
  interactiveRadius = 180,
  particleCount = 55,
  className = '',
}: InteractiveDotsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999, targetX: -9999, targetY: -9999, isHovered: false });
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const pulsesRef = useRef<PulsePacket[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    const colors = [
      { fill: 'rgba(99, 102, 241, 0.8)', glow: 'rgba(99, 102, 241, 0.4)' },  // Indigo
      { fill: 'rgba(6, 182, 212, 0.85)', glow: 'rgba(6, 182, 212, 0.45)' },  // Cyan
      { fill: 'rgba(168, 85, 247, 0.85)', glow: 'rgba(168, 85, 247, 0.45)' }, // Purple/Violet
      { fill: 'rgba(56, 189, 248, 0.85)', glow: 'rgba(56, 189, 248, 0.45)' }, // Sky
      { fill: 'rgba(236, 72, 153, 0.8)', glow: 'rgba(236, 72, 153, 0.4)' },  // Pink accent
    ];

    const initParticles = (w: number, h: number) => {
      const list: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const col = colors[Math.floor(Math.random() * colors.length)];
        list.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          radius: Math.random() * 2.2 + 1.2,
          baseAlpha: Math.random() * 0.4 + 0.35,
          color: col.fill,
          glowColor: col.glow,
          pulseSpeed: Math.random() * 0.03 + 0.015,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
      particlesRef.current = list;
    };

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particlesRef.current.length === 0) {
        initParticles(width, height);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    const parent = canvas.parentElement || canvas;

    const onMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouse.current.targetX = e.clientX - rect.left;
      mouse.current.targetY = e.clientY - rect.top;
      mouse.current.isHovered = true;

      // Random chance to emit neural pulse packet on move
      if (Math.random() < 0.08 && particlesRef.current.length > 0) {
        const nearby = particlesRef.current.filter((p) => {
          const dx = p.x - mouse.current.targetX;
          const dy = p.y - mouse.current.targetY;
          return Math.sqrt(dx * dx + dy * dy) < interactiveRadius;
        });
        if (nearby.length > 0) {
          const target = nearby[Math.floor(Math.random() * nearby.length)];
          pulsesRef.current.push({
            fromX: mouse.current.targetX,
            fromY: mouse.current.targetY,
            toX: target.x,
            toY: target.y,
            progress: 0,
            speed: Math.random() * 0.04 + 0.03,
            color: target.color,
          });
        }
      }
    };

    const onMouseEnter = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouse.current.targetX = e.clientX - rect.left;
      mouse.current.targetY = e.clientY - rect.top;
      mouse.current.x = mouse.current.targetX;
      mouse.current.y = mouse.current.targetY;
      mouse.current.isHovered = true;
    };

    const onMouseLeave = () => {
      mouse.current.isHovered = false;
      mouse.current.targetX = -9999;
      mouse.current.targetY = -9999;
    };

    const onClick = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Add expanding holographic ripple
      ripplesRef.current.push({
        x: clickX,
        y: clickY,
        radius: 5,
        maxRadius: 220,
        alpha: 0.9,
      });

      // Scatter nearby particles outward gently
      particlesRef.current.forEach((p) => {
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 0) {
          const force = (1 - dist / 180) * 12;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      });
    };

    parent.addEventListener('mousemove', onMouseMove);
    parent.addEventListener('mouseenter', onMouseEnter);
    parent.addEventListener('mouseleave', onMouseLeave);
    parent.addEventListener('click', onClick);

    let time = 0;

    const draw = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      if (mouse.current.isHovered) {
        mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.15;
        mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.15;
      } else {
        mouse.current.x += (-9999 - mouse.current.x) * 0.1;
        mouse.current.y += (-9999 - mouse.current.y) * 0.1;
      }

      const mx = mouse.current.x;
      const my = mouse.current.y;

      // 1. Draw Subtle AI Matrix Grid with Hover Reaction
      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const gx = i * dotSpacing;
          const gy = j * dotSpacing;
          const dx = mx - gx;
          const dy = my - gy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let r = dotRadius;
          let alpha = 0.12;

          if (dist < interactiveRadius) {
            const factor = 1 - dist / interactiveRadius;
            r = dotRadius + factor * 2.2;
            alpha = 0.12 + factor * 0.45;
            ctx.fillStyle = `rgba(129, 140, 248, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
          }

          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw Interactive Hologram Cursor Aura on Hover
      if (mouse.current.isHovered && mx > 0 && my > 0) {
        const glowGradient = ctx.createRadialGradient(mx, my, 0, mx, my, interactiveRadius);
        glowGradient.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
        glowGradient.addColorStop(0.4, 'rgba(6, 182, 212, 0.12)');
        glowGradient.addColorStop(0.7, 'rgba(168, 85, 247, 0.05)');
        glowGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(mx, my, interactiveRadius, 0, Math.PI * 2);
        ctx.fill();

        // Cursor central glowing core
        const coreGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 18);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGrad.addColorStop(0.3, 'rgba(99, 102, 241, 0.7)');
        coreGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(mx, my, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Update & Draw Neural Particles
      const particles = particlesRef.current;
      const maxConnectDist = 110;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic float velocity
        p.x += p.vx;
        p.y += p.vy;

        // Soft bounce against edges
        if (p.x < 10) { p.x = 10; p.vx *= -1; }
        if (p.x > width - 10) { p.x = width - 10; p.vx *= -1; }
        if (p.y < 10) { p.y = 10; p.vy *= -1; }
        if (p.y > height - 10) { p.y = height - 10; p.vy *= -1; }

        // Natural damping
        p.vx *= 0.985;
        p.vy *= 0.985;
        if (Math.abs(p.vx) < 0.15) p.vx += (Math.random() - 0.5) * 0.3;
        if (Math.abs(p.vy) < 0.15) p.vy += (Math.random() - 0.5) * 0.3;

        // Interaction with mouse cursor (Magnetic Gravitation + Elastic Orbit)
        const dx = mx - p.x;
        const dy = my - p.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        let isNearMouse = false;
        if (mouse.current.isHovered && distToMouse < interactiveRadius) {
          isNearMouse = true;
          const force = (1 - distToMouse / interactiveRadius);
          
          // Gentle attraction / swirl toward cursor
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle + 0.3) * force * 0.45;
          p.vy += Math.sin(angle + 0.3) * force * 0.45;

          // Synapse laser connection line between cursor and node
          const lineAlpha = (1 - distToMouse / interactiveRadius) * 0.85;
          const laserGrad = ctx.createLinearGradient(mx, my, p.x, p.y);
          laserGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          laserGrad.addColorStop(0.5, p.glowColor);
          laserGrad.addColorStop(1, p.color);

          ctx.strokeStyle = laserGrad;
          ctx.lineWidth = 1.2 * (1 - distToMouse / interactiveRadius) + 0.4;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        // Connections between neighbor particles (Constellation Network)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < maxConnectDist) {
            const alpha = (1 - cdist / maxConnectDist) * (isNearMouse ? 0.45 : 0.22);
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Node pulsation & glow
        const pulse = Math.sin(time * p.pulseSpeed * 20 + p.pulseOffset);
        const curRadius = p.radius + (isNearMouse ? 1.5 : 0) + pulse * 0.5;
        const curAlpha = Math.min(1, p.baseAlpha + (isNearMouse ? 0.5 : 0) + pulse * 0.15);

        // Outer glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, curRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.glowColor;
        ctx.fill();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(p.x, p.y, curRadius, 0, Math.PI * 2);
        ctx.fillStyle = isNearMouse ? '#ffffff' : p.color.replace(/[\d.]+\)$/, `${curAlpha})`);
        ctx.fill();
      }

      // 4. Update & Draw Synaptic Signal Pulses
      for (let k = pulsesRef.current.length - 1; k >= 0; k--) {
        const pulse = pulsesRef.current[k];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulsesRef.current.splice(k, 1);
          continue;
        }

        const px = pulse.fromX + (pulse.toX - pulse.fromX) * pulse.progress;
        const py = pulse.fromY + (pulse.toY - pulse.fromY) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. Update & Draw Ripples
      for (let r = ripplesRef.current.length - 1; r >= 0; r--) {
        const rip = ripplesRef.current[r];
        rip.radius += (rip.maxRadius - rip.radius) * 0.07 + 1.2;
        rip.alpha *= 0.94;

        if (rip.alpha < 0.02 || rip.radius >= rip.maxRadius) {
          ripplesRef.current.splice(r, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(99, 102, 241, ${rip.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(6, 182, 212, ${rip.alpha * 0.7})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      parent.removeEventListener('mousemove', onMouseMove);
      parent.removeEventListener('mouseenter', onMouseEnter);
      parent.removeEventListener('mouseleave', onMouseLeave);
      parent.removeEventListener('click', onClick);
      ro.disconnect();
    };
  }, [dotSpacing, dotRadius, interactiveRadius, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}

export default InteractiveDotsCanvas;
