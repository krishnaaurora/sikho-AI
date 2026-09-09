import React, { useEffect, useRef, useState } from 'react';

interface EducationalChip {
  id: number;
  text: string;
  category: string;
  icon: string;
  x: number;
  y: number;
}

const EDUCATIONAL_CONCEPTS = [
  { text: 'AI-Generated Curriculum', category: 'AI Learning', icon: '⚡' },
  { text: 'Algorand Micropayments (x402)', category: 'Web3', icon: '🔗' },
  { text: 'Verified Blockchain Credentials', category: 'Security', icon: '🛡️' },
  { text: 'Adaptive Skill Roadmaps', category: 'Growth', icon: '🎯' },
  { text: 'Decentralized Micro-Courses', category: 'Education', icon: '📚' },
  { text: 'Zero-Knowledge Proof Certs', category: 'Privacy', icon: '🔐' },
  { text: 'Real-time ATS Resume Intelligence', category: 'Career', icon: '💼' },
  { text: 'Personalized AI Tutoring', category: 'Mentorship', icon: '🤖' },
  { text: 'Automated Code Verification', category: 'Engineering', icon: '💻' },
  { text: 'Smart Contract Payment Protocol', category: 'Algorand', icon: '🚀' },
];

interface InteractiveDotsCanvasProps {
  className?: string;
  dotSpacing?: number;
  dotRadius?: number;
  interactiveRadius?: number;
}

export const InteractiveDotsCanvas: React.FC<InteractiveDotsCanvasProps> = ({
  className = '',
  dotSpacing = 22,
  dotRadius = 1.25,
  interactiveRadius = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredConcept, setHoveredConcept] = useState<EducationalChip | null>(null);
  const lastConceptTriggerTime = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
    };

    interface Dot {
      baseX: number;
      baseY: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      conceptIndex?: number;
    }

    let dots: Dot[] = [];

    const initDots = () => {
      dots = [];
      const cols = Math.ceil(width / dotSpacing) + 1;
      const rows = Math.ceil(height / dotSpacing) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = c * dotSpacing;
          const baseY = r * dotSpacing;
          dots.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initDots();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check if cursor is actually inside the canvas container
      if (mouseX < 0 || mouseY < 0 || mouseX > rect.width || mouseY > rect.height) {
        mouse.targetX = -1000;
        mouse.targetY = -1000;
        setHoveredConcept(null);
        return;
      }

      mouse.targetX = mouseX;
      mouse.targetY = mouseY;

      const now = Date.now();
      if (now - lastConceptTriggerTime.current > 180) {
        lastConceptTriggerTime.current = now;
        const randomIndex = Math.floor(Math.random() * EDUCATIONAL_CONCEPTS.length);
        const item = EDUCATIONAL_CONCEPTS[randomIndex];

        const safeX = Math.min(Math.max(mouseX, 140), width - 140);
        const safeY = Math.min(Math.max(mouseY - 40, 40), height - 60);

        setHoveredConcept({
          id: now,
          text: item.text,
          category: item.category,
          icon: item.icon,
          x: safeX,
          y: safeY,
        });
      }
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      setHoveredConcept(null);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    handleResize();

    const render = () => {
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        const dx = mouse.x - dot.baseX;
        const dy = mouse.y - dot.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = dot.baseX;
        let targetY = dot.baseY;
        let scale = 1;
        let alpha = 0.22;
        let glowColor = 'rgb(71, 85, 105)';

        if (dist < interactiveRadius) {
          const force = 1 - dist / interactiveRadius;
          const angle = Math.atan2(dy, dx);
          const pushDist = force * 20;
          targetX = dot.baseX - Math.cos(angle) * pushDist;
          targetY = dot.baseY - Math.sin(angle) * pushDist;

          scale = 1 + force * 2.4;
          alpha = 0.3 + force * 0.7;
          
          const rColor = Math.round(99 + force * (147 - 99));
          const gColor = Math.round(102 + force * (197 - 102));
          const bColor = Math.round(241 + force * (253 - 241));
          glowColor = `rgb(${rColor}, ${gColor}, ${bColor})`;
        }

        dot.vx += (targetX - dot.x) * 0.12;
        dot.vy += (targetY - dot.y) * 0.12;
        dot.vx *= 0.78;
        dot.vy *= 0.78;
        dot.x += dot.vx;
        dot.y += dot.vy;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotRadius * scale, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [dotSpacing, dotRadius, interactiveRadius]);

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Floating Educational Concept Tooltip on Hover */}
      {hoveredConcept && (
        <div
          style={{
            left: `${hoveredConcept.x}px`,
            top: `${hoveredConcept.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="absolute z-30 transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-md shadow-xl shadow-indigo-500/10 text-white whitespace-nowrap">
            <span className="text-base">{hoveredConcept.icon}</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider leading-none">
                {hoveredConcept.category}
              </span>
              <span className="text-xs font-semibold text-slate-100 mt-0.5">
                {hoveredConcept.text}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
