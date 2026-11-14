/**
 * Editorial content. All projects and the studio are fictional design studies;
 * nothing here claims a client, award, publication or completed building.
 */

export const overview = {
  label: 'Featured study',
  title: 'Stillwater House',
  lead: 'A retreat set into a wooded slope, organised around one sheltered courtyard and the light that reaches it.',
  body: [
    'Two horizontal volumes cross. Below, a low pavilion of honed limestone sits on a dark stone plinth, its south wall given over entirely to glass. Above, a timber-clad volume runs north to south and cantilevers five and a half metres over a reflecting pool, shading the terrace and framing the forest.',
    'Inside, the sequence is deliberately slow: a recessed porch, a pivoting oak door, a long living gallery held between a timber wall and the glazing, then a double-height stair hall lit from above. A single stair, cantilevered from the stone wall, connects the shared rooms below to the quieter rooms above.',
  ],
  meta: [
    ['Project', 'Stillwater House'],
    ['Type', 'Concept residence'],
    ['Setting', 'Fictional wooded slope'],
    ['Area', '280 m², design study'],
    ['Status', 'Unbuilt concept'],
    ['Year', '2026'],
  ] as [string, string][],
  views: [
    {
      file: 'view-pool.webp',
      caption: 'Beneath the cantilever, from the pool terrace.',
      alt: 'Looking up from the edge of the reflecting pool at the underside of the cantilevered timber volume, its battened skin glowing from the window behind.',
    },
    {
      file: 'view-feature-wall.webp',
      caption: 'The living gallery and its timber wall, washed from the ceiling.',
      alt: 'The living gallery seen from the glazing: lounge chairs and a low sofa in front of a full-width smoked oak wall lit by a recessed ceiling washer.',
    },
    {
      file: 'view-stair-up.webp',
      caption: 'The stair hall, looking up toward the skylight.',
      alt: 'An upward view in the double-height stair hall: oak treads cantilever from a pale stone wall beneath a skylight.',
    },
  ],
}

export const materialsCopy = {
  label: 'Material study',
  title: 'Three materials, resolved through detail.',
  intro:
    'The palette is kept deliberately small, so that proportion, joints and light carry the character of the house.',
  materials: [
    {
      id: 'oak',
      name: 'Smoked oak',
      where: 'Feature wall, entrance door, screen, stair treads, furniture frames',
      note: 'Fumed and oiled. Boards run vertically on the walls and along the length of each tread.',
    },
    {
      id: 'limestone',
      name: 'Honed limestone',
      where: 'Floors, external walls, stair wall, roof edges',
      note: 'Large-format 1.2 m tiles with 3 mm joints. A honed finish keeps reflections soft.',
    },
    {
      id: 'bronze',
      name: 'Brushed bronze',
      where: 'Glazing frames, thresholds, balusters, handrail',
      note: 'Used sparingly, wherever a hand or a line of glass meets the building.',
    },
  ],
}

export interface StudyProject {
  id: 'ridge' | 'courtyard'
  title: string
  summary: string
  concept: string[]
  meta: [string, string][]
  drawingTitle: string
}

export const selectedWork: StudyProject[] = [
  {
    id: 'ridge',
    title: 'Ridge Pavilion',
    summary: 'A single roof plane balanced along a ridge line.',
    concept: [
      'A shelter for walkers, imagined on an exposed ridge. One long, thin roof is the whole idea: it cantilevers at both ends and rests on a stone base that follows the ground rather than levelling it.',
      'Beneath it, a glazed room is set well back from the edges so the roof does the work of shade and shelter. From inside, the horizon becomes a continuous band between roof and stone.',
    ],
    meta: [
      ['Type', 'Concept pavilion'],
      ['Setting', 'Fictional ridge line'],
      ['Status', 'Unbuilt design study'],
      ['Year', '2026'],
    ],
    drawingTitle: 'Ridge Pavilion, long elevation: a thin roof plane over a set-back glazed room on a stone base following the ridge, with conifers at each end.',
  },
  {
    id: 'courtyard',
    title: 'Courtyard No. 04',
    summary: 'Four wings around a paved court and one tree.',
    concept: [
      'A compact house turned inward. Four wings of unequal depth enclose a square court paved on a six-metre grid, with a single tree at its centre.',
      'One corner is left open as the way in, so the court is entered on the diagonal and revealed gradually. Every room looks onto the same tree, which marks the seasons for the whole house.',
    ],
    meta: [
      ['Type', 'Concept courtyard house'],
      ['Setting', 'Fictional walled garden'],
      ['Status', 'Unbuilt design study'],
      ['Year', '2026'],
    ],
    drawingTitle: 'Courtyard No. 04, plan: four wings around a square paved court with a single central tree, entered through an open corner.',
  },
]

export const approach = {
  label: 'Approach',
  title: 'How the studio works.',
  principles: [
    {
      n: '01',
      title: 'Begin with place.',
      text: 'Every study starts on the ground: the fall of the land, the path of the sun, the trees worth keeping. The building is placed to complete what is already there.',
    },
    {
      n: '02',
      title: 'Work through material.',
      text: 'A short list of materials, chosen early and detailed carefully. Where they meet — floor to wall, glass to stone — is where the design is decided.',
    },
    {
      n: '03',
      title: 'Design for daily life.',
      text: 'Rooms are shaped around ordinary routines: where morning light falls, where to sit in the evening, how a door feels in the hand.',
    },
  ],
}

export const studio = {
  label: 'Studio',
  title: 'A small practice between landscape and building.',
  body: [
    'FORM / FIELD is imagined as an independent studio that takes on a few projects at a time and follows each from the first site walk to the last joint.',
    'The studio, its projects and Stillwater House are fictional. They were created as the subject of this portfolio website, to explore how architectural work could be presented through real-time 3D and scroll-driven storytelling.',
  ],
}
