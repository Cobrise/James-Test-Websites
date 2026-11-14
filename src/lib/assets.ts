/** Resolves files in public/renders against Vite's base so any host path works. */
export const renderUrl = (file: string) => `${import.meta.env.BASE_URL}renders/${file}`
