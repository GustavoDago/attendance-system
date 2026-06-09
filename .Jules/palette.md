## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2025-05-16 - Real-time Scanner Feedback and Accessibility
**Learning:** QR scanners often fail to provide immediate confirmation after a scan, leading to user confusion or double scans. Assistive technologies also need explicit ARIA live regions to announce scan results that appear dynamically.
**Action:** Implement a "Processing" state to hide the camera and show progress immediately after a successful scan. Use `role="alert"` and `aria-live="assertive"` on result containers to ensure results are announced by screen readers.

## 2025-05-17 - Centralized Layout Transitions and Sidebar Accessibility
**Learning:** Transition animations are best handled at the layout level using route keys to avoid component-level duplication. Collapsible sidebars often transition to icon-only states without providing text alternatives, making them inaccessible to screen readers.
**Action:** Always provide `aria-label` on navigation links in collapsed states and use `aria-hidden="true"` on decorative emojis. Apply `fadeIn` animations to the main container in the layout using `key={location.pathname}` to ensure smooth, accessible page transitions.
