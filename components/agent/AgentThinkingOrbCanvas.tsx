"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Search, Calendar, ShieldCheck, Cpu } from "lucide-react";

interface Step {
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}

const STEPS: Step[] = [
  {
    label: "Scanning clauses",
    sub: "Segmenting document sections & paragraphs…",
    icon: <Search className="w-3.5 h-3.5 text-cyan-400" />,
    color: "from-cyan-400 to-blue-500",
  },
  {
    label: "Analyzing obligations",
    sub: "Extracting deadlines, penalties & exact amounts…",
    icon: <Calendar className="w-3.5 h-3.5 text-indigo-400" />,
    color: "from-indigo-400 to-purple-500",
  },
  {
    label: "Verifying grounding",
    sub: "Cross-checking facts against original source…",
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    color: "from-emerald-400 to-teal-500",
  },
  {
    label: "Composing answer",
    sub: "Translating legalese into friendly Plain English…",
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    color: "from-amber-400 to-rose-500",
  },
];

export const AgentThinkingOrbCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Smooth step progression every 1.4s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  // High-fidelity 3D Luminous Particle Swarm
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 110;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = size / 2;
    const PARTICLE_COUNT = 48;
    const particles: {
      theta: number;
      phi: number;
      speed: number;
      radius: number;
      size: number;
      color: string;
      alpha: number;
    }[] = [];

    const palette = [
      "rgba(56, 189, 248, ",   // cyan-400
      "rgba(99, 102, 241, ",   // indigo-500
      "rgba(168, 85, 247, ",   // purple-500
      "rgba(52, 211, 153, ",   // emerald-400
      "rgba(244, 114, 182, ",  // pink-400
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(Math.random() * 2 - 1),
        speed: 0.8 + Math.random() * 0.8,
        radius: 24 + Math.random() * 14,
        size: 1.2 + Math.random() * 1.8,
        color: palette[i % palette.length],
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    let time = 0;
    let raf = 0;
    let isDead = false;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      time += 0.025;

      // Draw central pulsating core aura
      const pulse = Math.sin(time * 2) * 3;
      const coreGrad = ctx.createRadialGradient(
        center,
        center,
        2,
        center,
        center,
        26 + pulse
      );
      coreGrad.addColorStop(0, "rgba(56, 189, 248, 0.45)");
      coreGrad.addColorStop(0.4, "rgba(99, 102, 241, 0.25)");
      coreGrad.addColorStop(0.8, "rgba(168, 85, 247, 0.1)");
      coreGrad.addColorStop(1, "transparent");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(center, center, 28 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Render 3D Orbiting Swarm with Z-depth sorting
      const sorted = particles
        .map((p) => {
          const currentTheta = p.theta + time * p.speed * 0.7;
          const currentPhi = p.phi + Math.sin(time * 0.5) * 0.2;

          const x = p.radius * Math.sin(currentPhi) * Math.cos(currentTheta);
          const y = p.radius * Math.sin(currentPhi) * Math.sin(currentTheta);
          const z = p.radius * Math.cos(currentPhi);

          // 3D rotation around Y and X axis
          const cosY = Math.cos(time * 0.4), sinY = Math.sin(time * 0.4);
          const xRot = x * cosY - z * sinY;
          const zRot = x * sinY + z * cosY;

          const perspective = 2.4 / (2.4 - zRot / 40);
          const screenX = center + xRot * perspective;
          const screenY = center + y * perspective;
          const depth = (zRot + 40) / 80;

          return { screenX, screenY, depth, p };
        })
        .sort((a, b) => a.depth - b.depth);

      for (const item of sorted) {
        const { screenX, screenY, depth, p } = item;
        const alpha = Math.max(0.1, Math.min(1, p.alpha * (0.3 + 0.7 * depth)));
        const radius = Math.max(0.8, p.size * (0.6 + 0.6 * depth));

        ctx.fillStyle = `${p.color}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow highlight on front particles
        if (depth > 0.65) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.7).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!isDead) {
        raf = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isDead = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const step = STEPS[currentStep];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/40 to-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-500/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-500/15 blur-2xl" />

      <div className="relative z-10 flex items-center gap-3.5">
        {/* 3D Luminous Orb Visual */}
        <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
          {/* Subtle Rotating Neon Ring */}
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-spin [animation-duration:8s]" />
          <div className="absolute inset-1.5 rounded-full border border-dashed border-indigo-400/25 animate-spin [animation-duration:12s] [animation-direction:reverse]" />

          {/* Core Pulsing Halo */}
          <div className="absolute h-14 w-14 rounded-full bg-gradient-to-tr from-cyan-500/20 via-indigo-500/30 to-purple-500/20 blur-md animate-pulse" />

          {/* 3D Swarm Canvas */}
          <canvas
            ref={canvasRef}
            className="relative z-10 h-20 w-20 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Dynamic Reasoning Phase Information */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center gap-1.5 rounded-full bg-slate-800/80 px-2 text-[10px] font-semibold text-slate-300 border border-slate-700/60">
              <Cpu className="w-3 h-3 text-cyan-400 animate-spin [animation-duration:4s]" />
              <span>DocClear Agent</span>
            </span>

            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              Thinking
            </span>
          </div>

          {/* Animated Step Heading with smooth key cross-fade */}
          <div key={step.label} className="mt-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
            {step.icon}
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              {step.label}
            </h4>
          </div>

          {/* Subtitle description */}
          <p
            key={step.sub}
            className="text-[11px] text-slate-400 truncate mt-0.5 animate-in fade-in duration-300"
          >
            {step.sub}
          </p>

          {/* Sleek Hairline Gradient Progress Track */}
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${step.color} transition-all duration-700 ease-out`}
              style={{
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
