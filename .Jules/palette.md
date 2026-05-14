## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2026-05-14 - Enhancing Search Usability and Accessibility
**Learning:** Search interfaces are more pleasant when they offer a quick way to reset (Clear button) and more accessible when icon-only actions provide specific context about the record they affect. Additionally, robust filtering must account for potential null values in the data source.
**Action:** Implement a "Clear" button (✕) that appears when a search term is present. Add specific `aria-label` attributes to action buttons that include the subject's name (e.g., "Editar a Juan Perez" instead of just "Editar"). Always use null-checks when filtering data from APIs.
