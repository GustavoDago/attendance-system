## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2026-05-16 - Enhancing Attendance Feedback with Icons and State Management
**Learning:** Real-time feedback systems (like QR scanners) benefit significantly from combining visual icons with text to improve accessibility for color-blind users. Additionally, managing async side effects (like auto-redirection) via `useRef` ensures stability during component unmounting.
**Action:** Always include status icons (✅/⚠️/❌) in feedback messages and use `useRef` to track and clear redirection timeouts in React components to avoid memory leaks and erratic behavior.
