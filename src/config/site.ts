/**
 * Creator and site configuration — the single place to add James's details.
 * Leave a field as `null` until a real value exists: the interface only shows
 * links (portfolio, repository, email) when they are configured here.
 */
export interface CreatorConfig {
  /** Display name used in every credit. */
  name: string
  /** Optional surname; appended to the name where a full name reads better. */
  surname: string | null
  portfolioUrl: string | null
  repositoryUrl: string | null
  email: string | null
}

export const creator: CreatorConfig = {
  name: 'James',
  surname: null,
  portfolioUrl: null,
  repositoryUrl: null,
  email: null,
}

export const creatorFullName = creator.surname ? `${creator.name} ${creator.surname}` : creator.name

/** Exact credit line required in the opening composition and footer. */
export const creditLine = `Concept website by ${creatorFullName}.`

export const aboutLead = `Created by ${creatorFullName} as an independent portfolio project exploring real-time 3D, scroll-driven storytelling, and architectural web design.`

export const site = {
  studio: 'FORM / FIELD',
  project: 'Stillwater House',
  fictionStatement:
    'FORM / FIELD and Stillwater House are fictional concepts created for a portfolio project. They do not represent a real practice, client or building.',
  /**
   * Placeholder enquiry address. example.com is reserved for documentation, so
   * it can never reach a real inbox. Replace with a real address when one exists.
   */
  demoEmail: 'studio@example.com',
  demoEmailIsPlaceholder: true,
}
