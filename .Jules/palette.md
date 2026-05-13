## 2025-05-15 - Improving Login Accessibility and Feedback
**Learning:** Standard login forms often lack proper ARIA associations and visual feedback for async actions, which negatively impacts screen reader users and users with slower connections.
**Action:** Always associate `label` with `input` using `id`/`htmlFor`, add `autoComplete` for password managers, and implement a `loading` state to disable the submit button and provide clear visual feedback during authentication.

## 2026-05-13 - Enhancing Management Lists with Search and ARIA
**Learning:** Icon-only buttons and management filters (search, select) are frequently inaccessible to screen reader users without explicit ARIA labels. Adding a "Clear Search" button improves efficiency for power users.
**Action:** Use `aria-label` for all icon-only buttons and filter inputs. Implement `aria-live="polite"` on result counters to notify users of list changes. Provide a visible mechanism (like a "✕" button) to reset search filters.
