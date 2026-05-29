## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2025-05-16 - Real-time Scanner Feedback and Accessibility
**Learning:** QR scanners often fail to provide immediate confirmation after a scan, leading to user confusion or double scans. Assistive technologies also need explicit ARIA live regions to announce scan results that appear dynamically.
**Action:** Implement a "Processing" state to hide the camera and show progress immediately after a successful scan. Use `role="alert"` and `aria-live="assertive"` on result containers to ensure results are announced by screen readers.

## 2026-05-29 - Status Icons and Flexbox Alignment for Real-time Feedback
**Learning:** Adding status icons (✅, ⚠️, ❌) alongside text feedback significantly improves clarity for users, especially in kiosk mode where color vision deficiency or distance might make reading small text difficult. To make layout spacing (gap) work correctly between an icon and text, each must be wrapped in its own element (e.g., <span>) rather than being part of the same text node.
**Action:** Always wrap status icons and their associated text in separate elements when using flexbox with a gap for alignment. Use semantic status emojis to provide immediate visual context.
