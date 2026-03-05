import React, { useEffect, useMemo, useRef } from 'react';
import { motion, MotionValue, Variants, useScroll, useSpring, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ManifestoProps {
    isNight: boolean;
}

const CONFIG = {
    screens: 7,
    scrollIndexMax: 7,
    lineRanges: {
        pollution: [0.08, 0.28] as [number, number],
        blueLight: [0.25, 0.45] as [number, number],
        stress: [0.42, 0.62] as [number, number],
    },
};

const TerrainCanvas: React.FC<{ isNight: boolean; progress: MotionValue<number> }> = ({ isNight, progress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothProgress = useSpring(progress, {
        stiffness: 30,
        damping: 15,
        mass: 0.5,
        restDelta: 0.0001,
    }) as unknown as MotionValue<number>;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const cols = 40;
        const rows = 30;
        const scale = 120;

        // Keep allocations out of the render loop.
        const projX = new Float32Array(rows * cols);
        const projY = new Float32Array(rows * cols);
        const projZ = new Float32Array(rows * cols);

        const render = (p: number) => {
            ctx.clearRect(0, 0, width, height);

            const scrollOffset = p * 4000;
            const zOffset = scrollOffset / scale;
            const startZ = Math.floor(zOffset);
            const zShift = (zOffset - startZ) * scale;

            ctx.strokeStyle = isNight ? 'rgba(196, 205, 80, 0.25)' : 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1;

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const idx = y * cols + x;
                    const worldX = (x - cols / 2) * scale;
                    const worldZ = (y * scale) + zShift;
                    const realY = y - startZ;

                    const nx = x / cols - 0.5;
                    const ny = realY / rows;

                    let h = 0;
                    h -= (1 - Math.abs(nx * 2)) * 60;
                    h += Math.sin(nx * 15 + ny * 10) * 35;
                    h += Math.cos(nx * 25 + ny * 20) * 15;

                    const y3d = h + 180;
                    const camZ = -150;
                    const dz = worldZ - camZ;

                    projZ[idx] = dz;
                    if (dz > 0) {
                        const fov = 600;
                        projX[idx] = width / 2 + (worldX * fov) / dz;
                        projY[idx] = height * 0.45 + (y3d * fov) / dz;
                    }
                }
            }

            ctx.beginPath();

            for (let y = 0; y < rows; y++) {
                let first = true;
                for (let x = 0; x < cols; x++) {
                    const idx = y * cols + x;
                    if (projZ[idx] <= 0) continue;
                    if (first) {
                        ctx.moveTo(projX[idx], projY[idx]);
                        first = false;
                    } else {
                        ctx.lineTo(projX[idx], projY[idx]);
                    }
                }
            }

            for (let x = 0; x < cols; x++) {
                let first = true;
                for (let y = 0; y < rows; y++) {
                    const idx = y * cols + x;
                    if (projZ[idx] <= 0) continue;
                    if (first) {
                        ctx.moveTo(projX[idx], projY[idx]);
                        first = false;
                    } else {
                        ctx.lineTo(projX[idx], projY[idx]);
                    }
                }
            }

            ctx.stroke();
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            render(smoothProgress.get());
        };

        window.addEventListener('resize', resize);
        resize();

        const unsubscribe = smoothProgress.on('change', render);
        return () => {
            window.removeEventListener('resize', resize);
            unsubscribe();
        };
    }, [isNight, smoothProgress]);

    const maskClass = isNight
        ? 'from-[#020408] via-[#020408]/90 to-transparent'
        : 'from-[#c4cd50] via-[#c4cd50]/90 to-transparent';

    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className={`absolute top-0 left-0 w-full h-[55%] bg-gradient-to-b ${maskClass}`} />
        </div>
    );
};

const AnimatedChar: React.FC<{
    char: string;
    progress: MotionValue<number>;
    letterStart: number;
    letterDuration: number;
}> = ({ char, progress, letterStart, letterDuration }) => {
    const letterEnd = letterStart + letterDuration;
    const toNumber = (value: string | number) => (typeof value === 'number' ? value : Number(value) || 0);

    const opacity = useTransform(progress, (p: string | number) => {
        const pv = toNumber(p);
        if (pv <= letterStart || pv >= letterEnd) return 0;
        const t = (pv - letterStart) / letterDuration;
        if (t < 0.10) return t / 0.10;
        if (t > 0.90) return (1 - t) / 0.10;
        return 1;
    });

    const y = useTransform(progress, (p: string | number) => {
        const pv = toNumber(p);
        if (pv <= letterStart || pv >= letterEnd) return 0;
        const t = (pv - letterStart) / letterDuration;
        if (t < 0.25) {
            const nt = t / 0.25;
            const c1 = 1.70158;
            const c3 = c1 + 1;
            const easeOutBack = 1 + c3 * Math.pow(nt - 1, 3) + c1 * Math.pow(nt - 1, 2);
            return 40 * (1 - easeOutBack);
        }
        if (t > 0.85) {
            const nt = (t - 0.85) / 0.15;
            return -40 * (nt * nt * nt);
        }
        return 0;
    });

    return (
        <motion.span style={{ opacity, y, willChange: 'transform, opacity' }} className="inline-block">
            {char === ' ' ? '\u00A0' : char}
        </motion.span>
    );
};

const ScrollText: React.FC<{
    text: string;
    progress: MotionValue<number>;
    range: [number, number];
    textClassName?: string;
    wrapperClassName?: string;
}> = ({ text, progress, range, textClassName, wrapperClassName }) => {
    const [start, end] = range;
    const duration = end - start;
    const chars = useMemo(() => Array.from(text), [text]);
    const totalChars = Math.max(chars.length, 1);

    const containerY = useTransform(progress, [start, end], ['30vh', '-30vh']);
    const staggerMax = duration * 0.3;
    const letterActiveDuration = duration * 0.7;

    return (
        <motion.div className="absolute inset-0 flex items-center justify-start pointer-events-none px-6 md:px-12 lg:px-24" style={{ y: containerY }}>
            <div className={`max-w-3xl text-left ${wrapperClassName || ''}`}>
                <h2 className={`font-bold tracking-tight text-white leading-tight ${textClassName || 'text-2xl md:text-3xl lg:text-4xl'}`}>
                    {chars.map((char, index) => {
                        const stagger = staggerMax * (index / totalChars);
                        return (
                            <AnimatedChar
                                key={`${text}-${index}`}
                                char={char}
                                progress={progress}
                                letterStart={start + stagger}
                                letterDuration={letterActiveDuration}
                            />
                        );
                    })}
                </h2>
            </div>
        </motion.div>
    );
};

const Hero: React.FC<{
    isNight: boolean;
    opacity: MotionValue<number>;
    y: MotionValue<number>;
}> = ({ isNight, opacity, y }) => {
    const text1 = 'Cities are evolving.';
    const text2 = 'Your body... not so much.';
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03,
                delayChildren: 0.2,
            },
        },
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
        show: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                type: 'spring',
                stiffness: 150,
                damping: 10,
                mass: 0.8,
            },
        },
    };

    return (
        <motion.div style={{ opacity, y }} className="absolute inset-0 z-20 pointer-events-none">
            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="absolute top-1/2 -translate-y-1/2 left-6 md:left-12 lg:left-24 flex flex-col items-start gap-1 md:gap-2 text-left max-w-4xl"
            >
                <div className="flex flex-wrap justify-start gap-x-2 md:gap-x-3">
                    {words1.map((word, i) => (
                        <div key={`w1-${i}`} className="flex">
                            {Array.from(word).map((char, cIndex) => (
                                <motion.span
                                    key={cIndex}
                                    variants={item}
                                    className={`text-3xl md:text-5xl lg:text-[55px] font-bold tracking-tight leading-none ${isNight ? 'text-brand-lime' : 'text-white'}`}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap justify-start gap-x-1 md:gap-x-2 mt-1 md:mt-2">
                    {words2.map((word, i) => (
                        <div key={`w2-${i}`} className="flex">
                            {Array.from(word).map((char, cIndex) => (
                                <motion.span key={cIndex} variants={item} className="text-base md:text-2xl lg:text-[20px] font-bold text-white tracking-tight">
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

const Outro: React.FC<{ opacity: MotionValue<number>; y: MotionValue<number> }> = ({ opacity, y }) => (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex items-center justify-start z-20 pointer-events-none px-6 md:px-12">
        <div className="max-w-3xl text-left flex flex-col gap-2 md:gap-4">
            <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-white tracking-tight leading-tight">
                Your body didn&apos;t evolve for the world we&apos;ve built.
            </h2>
            <p className="text-2xl md:text-3xl lg:text-[36px] font-black text-white tracking-tight">
                But your way&apos;da is.
            </p>
        </div>
    </motion.div>
);

export const Manifesto: React.FC<ManifestoProps> = ({ isNight }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 80,
        damping: 25,
        restDelta: 0.001,
    });

    const heroOpacity = useTransform(smoothProgress, [0.0, 0.05, 0.12], [1, 1, 0]);
    const heroY = useTransform(smoothProgress, [0.0, 0.16], [0, -220]);

    const outroOpacity = useTransform(smoothProgress, [0.58, 0.66, 1.0], [0, 1, 1]);
    const outroY = useTransform(smoothProgress, [0.58, 0.66], [40, 0]);

    const scrollPromptOpacity = useTransform(smoothProgress, [0.0, 0.80, 0.88], [1, 1, 0]);
    const scrollPromptY = useTransform(smoothProgress, [0.0, 0.80, 0.88], [0, 0, -50]);
    const elementsPromptOpacity = useTransform(smoothProgress, [0.90, 0.96, 1.0], [0, 1, 1]);

    useEffect(() => {
        let isNavigating = false;
        let lastWheelTime = 0;
        let scrollAccumulator = 0;

        const handleWheel = (e: WheelEvent) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            if (rect.top <= 10 && rect.bottom >= window.innerHeight - 10) {
                if (isNavigating) {
                    e.preventDefault();
                    return;
                }

                const now = Date.now();
                if (now - lastWheelTime > 150) {
                    scrollAccumulator = 0;
                }
                lastWheelTime = now;
                scrollAccumulator += e.deltaY;

                if (scrollAccumulator > 650 && rect.bottom > window.innerHeight + 10) {
                    e.preventDefault();
                    isNavigating = true;
                    window.scrollTo({ top: window.scrollY + rect.bottom - window.innerHeight, behavior: 'smooth' });
                    setTimeout(() => { isNavigating = false; scrollAccumulator = 0; }, 800);
                } else if (scrollAccumulator < -650 && rect.top < -10) {
                    e.preventDefault();
                    isNavigating = true;
                    window.scrollTo({ top: window.scrollY + rect.top, behavior: 'smooth' });
                    setTimeout(() => { isNavigating = false; scrollAccumulator = 0; }, 800);
                }
            }
        };

        const wheelOptions = { passive: false } as const;
        window.addEventListener('wheel', handleWheel, wheelOptions);

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return (
        <section
            id="manifesto-section"
            ref={containerRef}
            className="relative w-full bg-transparent z-20 touch-pan-y snap-start"
            style={{ height: `calc(var(--app-vh) * ${CONFIG.scrollIndexMax})` }}
        >
            <div className="absolute inset-0 pointer-events-none z-0 flex flex-col">
                {Array.from({ length: CONFIG.screens }).map((_, i) => (
                    <div key={i} className={i === CONFIG.screens - 1 ? '' : 'snap-start'} style={{ height: 'var(--app-vh)' }} />
                ))}
            </div>

            <div className="sticky top-0 h-[var(--app-vh)] overflow-hidden z-10">
                <TerrainCanvas isNight={isNight} progress={smoothProgress} />

                <Hero isNight={isNight} opacity={heroOpacity} y={heroY} />

                <ScrollText text="Pollution your nose can't smell." progress={smoothProgress} range={CONFIG.lineRanges.pollution} />
                <ScrollText text="Blue light that steals your sleep." progress={smoothProgress} range={CONFIG.lineRanges.blueLight} />
                <ScrollText text="Stress that sticks." progress={smoothProgress} range={CONFIG.lineRanges.stress} />

                <Outro opacity={outroOpacity} y={outroY} />

                <motion.div
                    style={{ opacity: scrollPromptOpacity, y: scrollPromptY }}
                    className="absolute bottom-20 md:bottom-24 left-0 right-0 flex flex-col items-center gap-2 text-white z-30 pointer-events-none"
                >
                    <span className="text-xs md:text-sm uppercase tracking-[0.3em] font-bold">Scroll to adapt</span>
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
                        <ChevronDown className="w-5 h-5 opacity-70" />
                    </motion.div>
                </motion.div>

                <motion.div
                    style={{ opacity: elementsPromptOpacity }}
                    className="absolute bottom-20 md:bottom-24 left-0 right-0 flex flex-col items-center gap-2 text-white z-30 pointer-events-none"
                >
                    <span className="text-xs md:text-sm font-extrabold uppercase tracking-widest opacity-90 scale-90 drop-shadow-md">
                        MEET THE ELEMENTS
                    </span>
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
                        <ChevronDown size={20} />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
