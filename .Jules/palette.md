## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2025-05-16 - Real-time Scanner Feedback and Accessibility
**Learning:** QR scanners often fail to provide immediate confirmation after a scan, leading to user confusion or double scans. Assistive technologies also need explicit ARIA live regions to announce scan results that appear dynamically.
**Action:** Implement a "Processing" state to hide the camera and show progress immediately after a successful scan. Use `role="alert"` and `aria-live="assertive"` on result containers to ensure results are announced by screen readers.

## 2025-05-21 - Standardizing Feedback and Form Accessibility
**Learning:** Inconsistent feedback mechanisms (e.g., using both `alert()` and `toast`) create a disjointed experience. Additionally, administrative forms often overlook basic accessibility like `htmlFor` associations and `aria-required` attributes, which are critical for screen reader users.
**Action:** Standardize on `react-toastify` for all user feedback. Ensure every form input has a unique `id` explicitly associated with its `label` and includes `aria-required="true"` for mandatory fields.
