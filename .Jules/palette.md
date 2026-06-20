## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2025-05-16 - Real-time Scanner Feedback and Accessibility
**Learning:** QR scanners often fail to provide immediate confirmation after a scan, leading to user confusion or double scans. Assistive technologies also need explicit ARIA live regions to announce scan results that appear dynamically.
**Action:** Implement a "Processing" state to hide the camera and show progress immediately after a successful scan. Use `role="alert"` and `aria-live="assertive"` on result containers to ensure results are announced by screen readers.

## 2025-05-17 - Centralized Layout Transitions and Sidebar Accessibility
**Learning:** Transition animations are best handled at the layout level using route keys to avoid component-level duplication. Collapsible sidebars often transition to icon-only states without providing text alternatives, making them inaccessible to screen readers.
**Action:** Always provide `aria-label` on navigation links in collapsed states and use `aria-hidden="true"` on decorative emojis. Apply `fadeIn` animations to the main container in the layout using `key={location.pathname}` to ensure smooth, accessible page transitions.

## 2026-06-06 - Sidebar Accessibility for Collapsible Navigation
**Learning:** Collapsible sidebars often fail to provide descriptive labels for navigation items when reduced to icons. Decorative characters (like toggle arrows) and emojis can also create noise for screen readers if not explicitly hidden or labeled.
**Action:** Always provide `aria-label` for navigation links and buttons that may be reduced to icons. Use `aria-hidden="true"` on decorative elements (emojis, symbols) within interactive components to ensure a clean experience for assistive technologies.

## 2025-06-07 - Build Failures from Duplicate JSX Attributes
**Learning:** Duplicate JSX attributes (like `aria-label`) are caught as errors during the production build (`pnpm build`) by Vite/esbuild, even if the development server handles them without warning. This can lead to unexpected deployment blockers.
**Action:** Always verify accessibility improvements with a production build (`pnpm build`) to ensure no duplicate attributes were accidentally introduced. When fixing these, ensure the final interactive element remains properly labeled for screen readers.

## 2025-06-08 - Scanner Visual Context and Responsiveness
**Learning:** Kiosk users benefit significantly from immediate visual context (color changes) when switching between Entry and Exit modes. Hardcoded widths on camera containers can also break layouts on various tablet/mobile devices used as kiosks.
**Action:** Use dynamic background colors (e.g., light green for ingress, light red for egress) and directional icons to provide multi-modal feedback. Always use responsive width units (e.g., `width: '100%', maxWidth: '500px'`) for scanner containers.
