import { useEffect, useRef } from 'react';

interface InteractiveDotsCanvasProps {
  dotSpacing?: number;
  dotRadius?: number;
  dotColor?: string;
  interactiveRadius?: number;
  className?: string;
}

export function InteractiveDotsCanvas({
  dotSpacing = 20,
  dotRadius = 1.5,
  dotColor = 'rgba(148,163,184,0.4)',
  interactiveRadius = 140,
  className = '',
}: InteractiveDotsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width / dotSpacing);
      const rows = Math.ceil(canvas.height / dotSpacing);

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * dotSpacing;
          const y = j * dotSpacing;
          const dx = mouse.current.x - x;
          const dy = mouse.current.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let radius = dotRadius;
          let alpha = 0.4;

          if (dist < interactiveRadius) {
            const factor = 1 - dist / interactiveRadius;
            radius = dotRadius + factor * 3.5;
            alpha = 0.4 + factor * 0.6;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = dotColor.replace(/[\d.]+\)$/, `${alpha})`);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      ro.disconnect();
    };
  }, [dotSpacing, dotRadius, dotColor, interactiveRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'all' }}
    />
  );
}

export default InteractiveDotsCanvas;
