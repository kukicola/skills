# codex-review

A Skill that pairs Claude and OpenAI Codex for iterative code review — Codex reviews, Claude fixes, repeat until clean.

## What it does

1. Runs `codex review` CLI on your changes (staged, branch diff, or specific commit)
2. Claude triages findings into actionable issues, stylistic notes, and false positives
3. Claude applies minimal fixes for confirmed issues
4. Codex re-reviews the updated code
5. Loop repeats until Codex finds no more issues (max 5 rounds)

## Installation

```bash
npx skills add kukicola/skills/codex-review
```

### Prerequisites

- [Codex CLI](https://github.com/openai/codex) installed: `npm install -g @openai/codex`
- OpenAI API key configured for Codex

## Usage

Invoke the skill in Claude Code:

```
/codex-review
```

The skill auto-detects the review scope based on your git state, or you can specify:

```
/codex-review my staged changes
/codex-review branch diff against develop
/codex-review commit abc1234
```
