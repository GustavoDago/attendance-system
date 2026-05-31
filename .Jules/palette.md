## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2025-05-16 - Real-time Scanner Feedback and Accessibility
**Learning:** QR scanners often fail to provide immediate confirmation after a scan, leading to user confusion or double scans. Assistive technologies also need explicit ARIA live regions to announce scan results that appear dynamically.
**Action:** Implement a "Processing" state to hide the camera and show progress immediately after a successful scan. Use `role="alert"` and `aria-live="assertive"` on result containers to ensure results are announced by screen readers.

## 2025-05-17 - Table Accessibility and Feedback Patterns
**Learning:** Tables displaying dynamic data often lack visual indicators for loading and empty states, leading to a "static" feel. Additionally, icon-only buttons in table rows must have context-aware ARIA labels (e.g., including the item name) to be useful for screen reader users.
**Action:** Implement  and  states using a centered  with . For row actions, use  templates like `Acción de ${item.name}` and mark decorative icons with .

## 2025-05-17 - Table Accessibility and Feedback Patterns
**Learning:** Tables displaying dynamic data often lack visual indicators for loading and empty states, leading to a "static" feel. Additionally, icon-only buttons in table rows must have context-aware ARIA labels (e.g., including the item name) to be useful for screen reader users.
**Action:** Implement `loading` and `empty` states using a centered `td` with `colSpan`. For row actions, use `aria-label` templates like `Acción de ${item.name}` and mark decorative icons with `aria-hidden="true"`.
