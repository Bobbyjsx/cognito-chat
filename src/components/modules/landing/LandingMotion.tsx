"use client";

import React, { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type TargetAndTransition,
} from "framer-motion";
import { cn } from "@/lib/utils";

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
  isHero?: boolean; // When true, renders immediately without scroll observer for optimal LCP
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

  // If user prefers reduced motion, disable transforms & filters
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

  // For Hero elements: animate immediately upon mount for optimal LCP (no scroll latency)
  const isTriggered = isHero ? true : isInView;

  return (
    <motion.div
      ref={ref}
      initial={isHero ? initial : false}
      animate={isTriggered ? animate : initial}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Apple-standard fluid cubic-bezier
      }}
      className={cn("will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

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
