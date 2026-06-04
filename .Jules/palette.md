## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2025-05-16 - Real-time Scanner Feedback and Accessibility
**Learning:** QR scanners often fail to provide immediate confirmation after a scan, leading to user confusion or double scans. Assistive technologies also need explicit ARIA live regions to announce scan results that appear dynamically.
**Action:** Implement a "Processing" state to hide the camera and show progress immediately after a successful scan. Use `role="alert"` and `aria-live="assertive"` on result containers to ensure results are announced by screen readers.

## 2025-06-04 - Unified Page Transitions in Admin Layout
**Learning:** Adding entry animations to individual page components leads to maintenance overhead and potential inconsistencies. Centralizing transitions in a layout component provides a smoother and more reliable experience.
**Action:** Use the `fadeIn` utility on the main content container in the layout (e.g., `AdminLayout.jsx`) and apply a unique `key` (like `location.pathname`) to the container div to re-trigger the animation on every navigation.
