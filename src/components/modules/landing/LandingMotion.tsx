"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type TargetAndTransition,
} from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export type AnimationVariant =
  | "fade-up"
  | "fade-in"
  | "blur-fade"
  | "scale-up"
  | "slide-left"
  | "slide-right";

interface MotionRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  isHero?: boolean;
  viewportAmount?: number;
  once?: boolean;
}

const variantStyles: Record<
  AnimationVariant,
  (distance: number) => {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
  }
> = {
  "fade-up": (distance) => ({
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
  }),
  "fade-in": () => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  }),
  "blur-fade": (distance) => ({
    initial: { opacity: 0, y: distance * 0.6, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  }),
  "scale-up": () => ({
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
  }),
  "slide-left": (distance) => ({
    initial: { opacity: 0, x: -distance },
    animate: { opacity: 1, x: 0 },
  }),
  "slide-right": (distance) => ({
    initial: { opacity: 0, x: distance },
    animate: { opacity: 1, x: 0 },
  }),
};

export function MotionReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 0.5,
  distance = 24,
  className,
  isHero = false,
  viewportAmount = 0.15,
  once = true,
  ...props
}: MotionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: viewportAmount, once });
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className={className}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }

  const { initial, animate } = variantStyles[variant](distance);
  const isTriggered = isHero ? true : isInView;

  return (
    <motion.div
      ref={ref}
      initial={isHero ? false : initial}
      animate={isTriggered ? animate : initial}
      transition={{
        duration,
        delay: isHero ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn("will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          1. GSAP Text Stacker / Word Flipper               */
/* -------------------------------------------------------------------------- */

interface TextStackProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function TextStack({
  words,
  interval = 2600,
  className,
}: TextStackProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  // Find longest word to lock container width rigidly across all transitions
  const longestWord = words.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    words[0] ?? "",
  );

  return (
    <span
      className={cn(
        "relative inline-flex items-baseline justify-center overflow-hidden text-left align-baseline",
        className,
      )}
    >
      {/* Invisible ghost element matching longest word to lock bounding box with 0 layout shift */}
      <span
        aria-hidden="true"
        className="pointer-events-none invisible whitespace-nowrap underline decoration-transparent decoration-2 underline-offset-8 opacity-0 select-none"
      >
        {longestWord}
      </span>

      {/* Animated active word overlay */}
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: "100%", opacity: 0, rotateX: -60, filter: "blur(4px)" }}
          animate={{ y: "0%", opacity: 1, rotateX: 0, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, rotateX: 60, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            stiffness: 140,
            damping: 18,
            mass: 0.9,
          }}
          className="absolute inset-0 flex items-center justify-start whitespace-nowrap text-[#111111] underline decoration-[rgba(0,0,0,0.18)] decoration-2 underline-offset-8 will-change-transform"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                          2. Dynamic AI Typewriter Prompt                   */
/* -------------------------------------------------------------------------- */

interface TypewriterPromptProps {
  prompts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  className?: string;
}

export function TypewriterPrompt({
  prompts,
  typingSpeed = 38,
  deletingSpeed = 18,
  pauseTime = 2200,
  className,
}: TypewriterPromptProps) {
  const [text, setText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPrompt = prompts[promptIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && text === currentPrompt) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && text === "") {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPromptIndex((prev) => (prev + 1) % prompts.length);
      }, 400);
    } else {
      timeout = setTimeout(
        () => {
          setText((prev) =>
            isDeleting
              ? currentPrompt.substring(0, prev.length - 1)
              : currentPrompt.substring(0, prev.length + 1),
          );
        },
        isDeleting ? deletingSpeed : typingSpeed,
      );
    }

    return () => clearTimeout(timeout);
  }, [
    text,
    isDeleting,
    promptIndex,
    prompts,
    typingSpeed,
    deletingSpeed,
    pauseTime,
  ]);

  return (
    <span className={cn("inline-flex items-center font-mono", className)}>
      <span>{text}</span>
      <span className="ml-0.5 inline-block h-[1.15em] w-[2px] animate-pulse bg-[#111111] align-middle" />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                          3. GSAP Magnetic Interaction Button               */
/* -------------------------------------------------------------------------- */

export function GsapMagnetic({
  children,
  className,
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

      const handleMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = (e.clientX - centerX) * strength;
        const distanceY = (e.clientY - centerY) * strength;

        xTo(distanceX);
        yTo(distanceY);
      };

      const handleMouseLeave = () => {
        xTo(0);
        yTo(0);
      };

      el.addEventListener("mousemove", handleMouseMove);
      el.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        el.removeEventListener("mousemove", handleMouseMove);
        el.removeEventListener("mouseleave", handleMouseLeave);
      };
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={cn("inline-block will-change-transform", className)}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          4. GSAP ScrollTrigger Text Scrub                  */
/* -------------------------------------------------------------------------- */

export function GsapTextScrub({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const words = el.querySelectorAll(".gsap-scrub-word");

      gsap.fromTo(
        words,
        { opacity: 0.18, y: 3 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 45%",
            scrub: 0.6,
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <p ref={containerRef} className={cn("inline-block", className)}>
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          className="gsap-scrub-word will-change-opacity mr-[0.28em] inline-block"
        >
          {word}
        </span>
      ))}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*                          5. Stagger Bento Grids                            */
/* -------------------------------------------------------------------------- */

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  viewportAmount?: number;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.08,
  className,
  viewportAmount = 0.1,
  ...props
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: viewportAmount, once: true });
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className={className}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  distance = 20,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: distance },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

export function TextScrubReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { amount: 0.3, once: true });

  return (
    <p ref={ref} className={cn("inline-block", className)}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.2, y: 4 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 4 }}
          transition={{
            duration: 0.35,
            delay: i * 0.03,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mr-[0.28em] inline-block transition-opacity"
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

export function HoverLift({
  children,
  className,
  lift = -3,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ y: lift }}
      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
      className={cn("transition-shadow duration-200", className)}
    >
      {children}
    </motion.div>
  );
}
