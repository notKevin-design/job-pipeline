# Skill: setup

New-user onboarding for the Job Pipeline. Launches the setup wizard UI to collect all required configuration values and write `USER_CONFIG.md`.

Triggers on: "set up the pipeline", "run setup", "configure my pipeline", "onboarding", or when CLAUDE.md instructs Claude to run setup because USER_CONFIG.md is missing.

---

## Steps

1. **Install dependencies** (if needed):
   Run `npm install` via Bash. Skip if `node_modules` already exists.

2. **Start the setup wizard**:
   Run the dev server via Bash (background):
   ```bash
   npm run dev -- -p 3100
   ```

3. **Open the wizard in the browser**:
   Run `open http://localhost:3100` via Bash (macOS).

4. **Tell the user**:
   > The setup wizard is now running at **http://localhost:3100**.
   >
   > Walk through the steps in the browser — it will:
   > - Read your resume Google Doc to pre-fill your profile and detect section anchors
   > - Let you preview a job score before finishing setup
   > - Write `USER_CONFIG.md` when you click Save
   >
   > Come back here when you're done. You can close the wizard with `Ctrl+C` or it will stop when you end this session.
