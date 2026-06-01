## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2025-05-16 - Real-time Scanner Feedback and Accessibility
**Learning:** QR scanners often fail to provide immediate confirmation after a scan, leading to user confusion or double scans. Assistive technologies also need explicit ARIA live regions to announce scan results that appear dynamically.
**Action:** Implement a "Processing" state to hide the camera and show progress immediately after a successful scan. Use `role="alert"` and `aria-live="assertive"` on result containers to ensure results are announced by screen readers.

## 2026-06-01 - Defensive Rendering and Enhanced Feedback
**Learning:** UI components can crash when rendering initials or data from partial user objects (e.g., missing names). Replacing intrusive browser `alert()` with `toast` notifications improves the visual flow and accessibility.
**Action:** Use optional chaining and nullish coalescing for all text-based rendering of user data (e.g., avatars). Use `aria-label` on all icon-only buttons and hide decorative emojis using `aria-hidden="true"`.
