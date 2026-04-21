Tailor the resume for a specific job and save it to Google Drive — using the skill defined in skills/customize-resume.md.

Check context for gap analysis output from analyze-resume, or ask via AskUserQuestion widget, then:
1. Resolve inputs — scan for analyze-resume PIPELINE CONTEXT; if `global_context` is missing, follow `skills/gather-context.md` Step 1 only
2. Rewrite the summary paragraph, bold key bullets, and reorder KEY SKILLS to match the JD
3. Deliver full revised resume (plain text), change log, and remaining risks
4. Copy the source Google Doc and surgically apply changes via gws CLI
5. Output: 📄 Saved to Drive: [URL]
6. Emit a PIPELINE CONTEXT block for downstream skills

Refer to skills/customize-resume.md for full instructions, content rules, and the Drive save script.
