export const BREAKPOINTS = {
    compactMobileMax: 380,
    mobileMax: 640,
    tabletMax: 1024,
} as const;

export const MEDIA_QUERIES = {
    compactMobile: `(max-width: ${BREAKPOINTS.compactMobileMax}px)`,
    mobile: `(max-width: ${BREAKPOINTS.mobileMax}px)`,
    desktop: `(min-width: ${BREAKPOINTS.tabletMax + 1}px)`,
} as const;
