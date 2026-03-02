---
name: codex-review
disable-model-invocation: true
description: Iterative code review using OpenAI Codex CLI and Claude working together. Codex reviews the code, Claude applies fixes, and the loop repeats until no issues remain. 
---

# Codex Review

Iterative code review loop: Codex reviews code → Claude fixes issues → Codex re-reviews → repeat until clean.

## Workflow

### 1. Determine review scope

Ask the user if not obvious from context. Support these modes:

- **Staged changes**: `--uncommitted`
- **Branch diff**: `--base <branch>` (default base: `main`)
- **Specific commit**: `--commit <sha>`

If the user says "review my changes" without specifics, check `git status` and `git log --oneline -5` to infer the best mode. Prefer `--base` with the default branch if on a feature branch, `--uncommitted` if there are uncommitted changes.

### 2. Run Codex review

Use `codex exec review` (not `codex review`) to run non-interactively with clean output:

```bash
codex exec review <scope-flags> -o .codex-review-output.md
```

The `-o` flag writes only the final review message to the file, excluding all progress/status noise. Read `.codex-review-output.md` after the command completes.

If the user wants to use a specific model, pass `-m <model>` (e.g., `-m o3`).

Delete `.codex-review-output.md` after reading it.

### 3. Analyze Codex findings

Read the review output. Categorize each finding:

- **Actionable**: Clear bugs, security issues, logic errors, missing error handling, performance problems — fix these.
- **Stylistic/subjective**: Naming preferences, minor formatting — skip unless the user explicitly wants these fixed too.
- **False positives**: Findings that are incorrect or don't apply — skip.

Present a summary to the user:
```
Codex found N issues (X actionable, Y skipped).
Fixing: [brief list of what will be fixed]
Skipping: [brief list of what was skipped and why]
```

Wait for user confirmation before applying fixes. The user may override which findings to fix or skip.

### 4. Apply fixes

Fix each actionable issue. For each fix:
- Read the relevant source file to understand full context
- Apply the minimal change needed
- Do not refactor surrounding code unless the finding specifically calls for it

Stage all fixes after applying them: `git add <changed files>`.

### 5. Re-review

Run Codex review again on the new changes using the same scope/flags as step 2.

Read the output. If Codex finds new issues:
- Summarize them to the user
- After user confirmation, apply fixes and re-review (go to step 4)

If Codex reports no issues or only has minor stylistic notes, the loop is complete.

### 6. Finish

Report the final status:
```
Review complete. N rounds, M total fixes applied.
```

List all files modified. Do **not** commit — leave that to the user.

## Notes

- Maximum 5 review rounds to avoid infinite loops. If issues persist after 5 rounds, report remaining findings and stop.
- If `codex` CLI is not installed, tell the user to install it: `npm install -g @openai/codex`
- If Codex returns an error (auth, network, etc.), report it clearly and stop.
- Preserve the user's code style. Match existing patterns in the codebase.
