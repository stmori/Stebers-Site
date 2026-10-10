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
- **Stay in your folder.** `site/` is Evanton's and `projects/med-vqa/` is Jake's. If you need a change in the other's folder, ask or flag it in the PR.
- **Never commit secrets.** No API keys, tokens, passwords or `.env` files. Commit `.env.example` with blank values instead. If a secret is ever pushed, rotate it immediately; deleting the commit isn't enough.
- **No big files.** Datasets, search indexes, model weights and build output stay out of git (see `.gitignore`).

## If main moved while you were working

```bash
git checkout main && git pull
git checkout your/branch && git merge main    # fix any conflicts, then commit and push
```

A conflict means you both edited the same lines. Open the file, keep the right version between the `<<<<<<<` / `>>>>>>>` markers, delete the markers, then `git add` the file and commit.
