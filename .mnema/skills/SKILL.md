# Skills

Skills are reusable procedures the agent can follow when solving
a recurring problem in this project. Add one Markdown file per
skill, link them from this index when stable, and keep the
individual skill bodies short — agents read everything that is
referenced.

## Available skills

- [creating-tasks.md](default/creating-tasks.md)
- [transitioning-tasks.md](default/transitioning-tasks.md)
- [handling-blockers.md](default/handling-blockers.md)
- [recording-decisions.md](default/recording-decisions.md)
- [report-issue.md](default/report-issue.md)

## Conventions

Every skill ships with YAML frontmatter (`name`, `version`,
`description`, `tools_used`) plus at least one `## Example`
section. Run `mnema skill lint` before committing changes — it
enforces those conventions and catches stale tool references.
