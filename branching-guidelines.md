# Branching Guidelines

Due to the 90-minute constraint, we follow a **Feature-Branch Workflow**:

- **`main`**: Production-ready code only. Always deployable.
- **`develop`**: Integration branch for features.
- **`feat/*`**: Individual features (e.g., `feat/auth`, `feat/charts`).
- **`fix/*`**: Emergency bug fixes during the final 15-minute polish.

**Workflow:**
1. Create feature branch from `develop`.
2. Complete task.
3. Fast-forward merge into `develop`.
4. Final merge `develop` -> `main` for deployment.