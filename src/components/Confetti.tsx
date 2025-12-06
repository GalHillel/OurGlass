"use client";

import { useEffect, useRef } from "react";

export const Confetti = ({ trigger }: { trigger: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!trigger || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const titleScreen = window.innerWidth < 600;
        const count = titleScreen ? 100 : 200;
        const gravity = 0.5;
        const friction = 0.99;

        let particles: Particle[] = [];
        const colors = ["#FCD34D", "#34D399", "#60A5FA", "#F87171", "#A78BFA"];

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            color: string;
            alpha: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * (Math.random() * 20); // Boom
                this.vy = (Math.random() - 1) * (Math.random() * 20) - 5; // Up
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.alpha = 1;
            }

            update() {
                this.vy += gravity;
                this.vx *= friction;
                this.vy *= friction;
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= 0.01;
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, 8, 8); // Square confetti
                ctx.restore();
            }
        }

        // Explode from center
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(canvas.width / 2, canvas.height / 2));
        }

        const animate = () => {
            if (!ctx || particles.length === 0) {
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles = particles.filter(p => p.alpha > 0);
            particles.forEach(p => {
                p.update();
                p.draw(ctx);
            });

            if (particles.length > 0) {
                requestAnimationFrame(animate);
            }
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, [trigger]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
        />
    );
};
