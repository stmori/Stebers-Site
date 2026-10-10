# How we work in this repo

## The loop (every change)

```bash
git checkout main && git pull                 # 1. start from the latest main
git checkout -b jake/short-topic               # 2. new branch: <name>/<topic>, e.g. evanton/landing-page
# ... edit files ...
git add -A && git commit -m "Say what changed and why"   # 3. commit (as often as you like)
git push -u origin jake/short-topic            # 4. push the branch
```

5. On GitHub, open a pull request from your branch into `main`. Say what changed and how to test it.
6. The other person reviews and merges. Delete the branch after merging.

## Rules

- **Never push to `main` directly.** Everything goes through a pull request.
- **One topic per branch.** Small PRs get reviewed and merged faster and conflict less.
- **Stay in your folder.** `web/` is Evanton's and `services/med-vqa-*` is Jake's. `deploy/` is shared: tag the other person on changes there. If you need a change in the other's folder, ask or flag it in the PR.
- **Never commit secrets.** No API keys, tokens, passwords or `.env` files. Commit `.env.example` with blank values instead. If a secret is ever pushed, rotate it immediately; deleting the commit isn't enough.
- **No big files.** Datasets, search indexes, model weights and build output stay out of git (see `.gitignore`).

## Who merges what

| PR changes files in... | Who merges |
|---|---|
| only `projects/med-vqa/` | Jake (or Jake's Claude Code session) may merge it once its tests pass. Evanton is still welcome to comment. |
| `site/` | Jake reviews; Evanton merges. |
| anything at the root (`README.md`, `CONTRIBUTING.md`, `.gitignore`, ...) or more than one area | The other person reviews and merges. |

Jake works with Claude Code, which opens PRs from Jake's account (Jeber811). It follows the same rules: it never pushes to `main`, uses `jake/<topic>` branches, and only merges PRs that change `projects/med-vqa/` alone.

## If main moved while you were working

```bash
git checkout main && git pull
git checkout your/branch && git merge main    # fix any conflicts, then commit and push
```

A conflict means you both edited the same lines. Open the file, keep the right version between the `<<<<<<<` / `>>>>>>>` markers, delete the markers, then `git add` the file and commit.
