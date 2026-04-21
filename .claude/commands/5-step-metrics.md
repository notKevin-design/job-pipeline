Show per-step token usage and time duration across pipeline skills — using the skill defined in skills/step-metrics.md.

Scan conversation history for PIPELINE CONTEXT blocks from completed pipeline skills, then:
1. Extract step_start_time, step_end_time, step_duration_min, and output_tokens_est from each block
2. Compute cumulative token totals across all steps
3. Output a summary table with step, job, output tokens (est.), cumulative tokens (est.), duration (min), start, end, and status
4. Write a CSV report to /tmp/step_metrics_YYYY-MM-DD.csv
5. Add a 2–3 sentence explanation of which step consumed the most tokens and why

All numbers are estimates logged by each skill at runtime. Refer to skills/step-metrics.md for full instructions and limitations.
