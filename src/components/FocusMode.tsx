'use client';

import { useState, useEffect, useRef } from 'react';
import { Maximize2, Play, Pause, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function FocusMode() {
  const [isActive, setIsActive] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Avoid calling setState synchronously within an effect
      setTimeout(() => {
        setIsTimerRunning(false);
        // Switch mode
        if (mode === 'work') {
          setMode('break');
          setTimeLeft(5 * 60);
        } else {
          setMode('work');
          setTimeLeft(25 * 60);
        }
      }, 0);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, mode]);

  // Generative background logic
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const particleCount = 50;
      const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 5 + 2,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
      );
      gradient.addColorStop(0, mode === 'work' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '22'; // low opacity
        ctx.fill();
        
        // Add glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [isActive, mode]);

  const toggleFocusMode = () => {
    setIsActive(!isActive);
    if (!isActive) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleFocusMode}
        className="gap-2 text-muted-foreground hover:text-primary rounded-xl"
      >
        <Maximize2 className="w-4 h-4" />
        <span className="hidden sm:inline">Focus Mode</span>
      </Button>

      {isActive && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background select-none">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFocusMode}
            className="absolute top-8 right-8 text-muted-foreground hover:text-primary rounded-full w-12 h-12 p-0"
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="relative z-10 flex flex-col items-center gap-8 text-center">
            <div className="space-y-2">
              <h2 className={cn(
                "text-2xl font-medium tracking-widest uppercase",
                mode === 'work' ? "text-primary" : "text-emerald-500"
              )}>
                {mode === 'work' ? 'Focus Time' : 'Break Time'}
              </h2>
              <div className="text-9xl font-thin tracking-tighter tabular-nums">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="lg"
                onClick={resetTimer}
                className="rounded-full w-16 h-16 p-0 border-border/50 hover:bg-accent/50"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>

              <Button
                variant="default"
                size="lg"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={cn(
                  "rounded-full w-24 h-24 p-0 shadow-2xl transition-transform hover:scale-105 active:scale-95",
                  mode === 'work' ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"
                )}
              >
                {isTimerRunning ? (
                  <Pause className="w-10 h-10 fill-current" />
                ) : (
                  <Play className="w-10 h-10 fill-current ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="rounded-full w-16 h-16 p-0 border-border/50 hover:bg-accent/50 opacity-0 pointer-events-none"
              >
                {/* Spacer for balance */}
              </Button>
            </div>

            <p className="max-w-md text-muted-foreground/60 text-sm italic">
              &quot;The successful warrior is the average man, with laser-like focus.&quot;
            </p>
          </div>
        </div>
      )}
    </>
  );
}
