export const COMMON_DIRECTIVES = `
## Universal Code Quality Rules (apply to ALL code you generate)
- **Traceability comments**: Every class, function, API route, and complex logic block MUST have a comment explaining its purpose, inputs, outputs, and any non-obvious decisions.
- **File-level headers**: Every generated code file must start with a comment block: file path, purpose, author (Blueprint), and key dependencies.
- **Inline comments**: Comment ALL non-trivial logic — SQL queries, auth flows, state transitions, async patterns.
- **TODO markers**: Mark any placeholder or stub with \`# TODO: [description]\` so they are discoverable.

## User-Defined Standards & Guidelines
- If a section titled "User-Defined Standards & Guidelines" exists in the context below, you MUST follow those rules, naming conventions, and folder structures with absolute priority. They overwrite any of your default patterns.
`;

export const WOW_FACTOR_DIRECTIVE = `
## Wow Factor — Delight the User
Include a dedicated "✨ Wow Factor" section covering:
- 3-5 signature micro-interactions or animations (e.g., skeleton screens, spring physics, haptic feedback patterns)
- One unexpected delight feature that goes beyond requirements (e.g., real-time collaboration cursor, confetti on milestone, AI-generated summary on hover)
- Premium visual flourishes: glassmorphism panels, gradient text, smooth page transitions
- Empty state design: beautiful, branded, and helpful — never a blank screen
- Loading states: branded spinners, skeleton shimmer, progress storytelling
`;
