export const TRANSITION_SPEEDS = { slow: 0.6, normal: 1, fast: 1.8 } as const;
export type TransitionSpeed = keyof typeof TRANSITION_SPEEDS;
