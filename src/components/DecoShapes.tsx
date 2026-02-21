import { motion } from "framer-motion";

type Shape = {
  type: "heart" | "star" | "triangle" | "circle" | "blob";
  color: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  delay: number;
};

function Heart({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function Star({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16l-6.4 5.2L8 14 2 9.2h7.6z" />
    </svg>
  );
}

function Triangle({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L2 22h20z" />
    </svg>
  );
}

function Circle({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="12" r="11" />
    </svg>
  );
}

function Blob({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2c3 0 5.5 1.5 7 4s2 5.5 1 8-3 4.5-5.5 5.5S9 20 7 18s-3.5-4.5-3-7.5S6 4 9 2.5 11 2 12 2z" />
    </svg>
  );
}

const SHAPE_MAP = { heart: Heart, star: Star, triangle: Triangle, circle: Circle, blob: Blob };

type Props = {
  shapes: Shape[];
  className?: string;
};

export type { Shape };

export function DecoShapes({ shapes, className = "" }: Props) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {shapes.map((s, i) => {
        const Comp = SHAPE_MAP[s.type];
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${s.x}%`, top: `${s.y}%`, rotate: s.rotate }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: s.delay, ease: [0.16, 1, 0.3, 1] }}
          >
            <Comp color={s.color} size={s.size} />
          </motion.div>
        );
      })}
    </div>
  );
}
