"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
    value: number[];
    onValueChange: (value: number[]) => void;
    max?: number;
    step?: number;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, onValueChange, max = 100, step = 1, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange([parseFloat(e.target.value)]);
        };

        const percentage = ((value[0] || 0) / max) * 100;

        return (
            <div dir="ltr" className={cn("relative flex w-full touch-none select-none items-center", className)}>
                <input
                    type="range"
                    min={0}
                    max={max}
                    step={step}
                    value={value[0]}
                    onChange={handleChange}
                    ref={ref}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                    {...props}
                />
                <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/10">
                    <div
                        className="absolute h-full bg-white transition-all duration-150 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div
                    className="absolute h-5 w-5 rounded-full border-2 border-white bg-black ring-offset-background transition-transform duration-150 ease-out pointer-events-none shadow-lg"
                    style={{ left: `calc(${percentage}% - 10px)` }}
                />
            </div>
        );
    }
);
Slider.displayName = "Slider";
