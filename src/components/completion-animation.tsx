'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CompletionAnimationProps {
    score: number;
    rank: 'S' | 'A' | 'B' | 'C' | 'D';
    onComplete?: () => void;
}

export function CompletionAnimation({ score, rank, onComplete }: CompletionAnimationProps) {
    useEffect(() => {
        // Trigger confetti animation
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                if (onComplete) {
                    onComplete();
                }
                return;
            }

            const particleCount = 50 * (timeLeft / duration);

            // Different confetti patterns based on rank
            if (rank === 'S') {
                // Epic celebration for S rank
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    colors: ['#FFD700', '#FFA500', '#FF6347'],
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    colors: ['#FFD700', '#FFA500', '#FF6347'],
                });
            } else if (rank === 'A') {
                // Great celebration for A rank
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.3, 0.7), y: Math.random() - 0.2 },
                    colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
                });
            } else {
                // Standard celebration for B, C, D ranks
                confetti({
                    ...defaults,
                    particleCount: particleCount / 2,
                    origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 },
                    colors: ['#2196F3', '#03A9F4', '#00BCD4'],
                });
            }
        }, 250);

        return () => clearInterval(interval);
    }, [rank, onComplete]);

    return null; // This component doesn't render anything visible
}
