export const imageMasks = {
  triangle: "polygon(50% 100%, 0% 0%, 100% 0%)",
  triangleUp: "polygon(50% 0%, 0% 100%, 100% 100%)",
  circle: "circle(50% at 50% 50%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  hexagon: "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)",
  star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
} as const;

export type ImageMaskShape = keyof typeof imageMasks;

export const imageMaskOptions = [
  { title: "Triangle", value: "triangle" },
  { title: "Triangle up", value: "triangleUp" },
  { title: "Circle", value: "circle" },
  { title: "Diamond", value: "diamond" },
  { title: "Hexagon", value: "hexagon" },
  { title: "Star", value: "star" },
];
