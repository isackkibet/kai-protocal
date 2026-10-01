# Unused components

Nothing in `src/app` imports these files (checked 2026-10-01). They still
compile, so they cannot break a build, but they are not shown on any page.

Before using one, check it still matches the current APIs: several were
written for routes that no longer exist (`/insurance`, `/pension`, `/trust`).
When you start using a component, move it to the folder for its area
(e.g. `components/wallet/`). If it stays unused, it is safe to delete.
