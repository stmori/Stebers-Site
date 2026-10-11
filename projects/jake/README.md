# projects/jake

Content for Jake Weber's portfolio: one folder per project, plus a profile. **This folder holds content only.** The website (`web/app/jake/`) renders it at `/jake/` at build time, so the design can change without touching the content, and adding a project means adding a folder.

```
projects/jake/
├── profile/
│   ├── profile.md          bio, links, education, skills, certifications, activities
│   └── media/              headshot.jpg (to be added)
└── <project-slug>/
    ├── project.md          front matter (structured fields) + the write-up in Markdown
    └── media/              compressed images used by project.md (paths are relative to the project folder)
```

## Projects, in display order

| order | folder | status |
|---|---|---|
| 1 | `med-vqa/` | live (has its own interactive page at `/projects/med-vqa/`) |
| 2 | `fsi-bldc-motor-drive/` | complete |
| 3 | `wriva-cvgl-challenge/` | complete |
| 4 | `diffusion-virtual-staining/` | complete |
| 5 | `lora-mobilesam-nuclei/` | complete |
| 6 | `autonomous-drone/` | in progress |

Planned additions: Gaussian splatting research (with YouTube demo videos) and the CAP 6411 long-sequence VGGT project.

## `project.md` front matter

Every project uses the same YAML fields. Optional fields can be missing or empty.

| field | type | meaning |
|---|---|---|
| `slug` | string | URL-safe id; same as the folder name. Rendered at `/jake/<slug>/` |
| `title` | string | Full title |
| `short_title` | string | For cards and navigation |
| `order` | int | Display order on the portfolio page (1 = first) |
| `featured` | bool | Show in the top "featured" row |
| `status` | `live` \| `complete` \| `in-progress` | `in-progress` should show a badge |
| `published` | bool | **If `false`, don't render the project at all** (drafts awaiting approval) |
| `period` | string | Human-readable dates, e.g. `Aug 2025 – Mar 2026` |
| `context` | string | Course, event, sponsor or organization |
| `role` | string | Jake's role |
| `team` | list of strings | Everyone involved, Jake included. `[Jake Weber]` means solo |
| `summary` | string | 1–2 sentences for cards and previews |
| `highlights` | list of strings | 3–5 resume-style bullets |
| `metrics` | list of `{value, label}` | Headline numbers for stat tiles, e.g. `{value: "15th", label: "global rank"}` |
| `tech` | list of strings | Stack, for tags |
| `links` | list of `{label, url}` | GitHub, live demo, leaderboard, … (external links open in a new tab) |
| `cover` | path | Card/hero image, relative to the project folder |
| `gallery` | list of `{src, alt, caption, position}` | Images, shown at the top of the project page under the headline. Add `position: bottom` to show one at the end of the page instead |
| `youtube` | list of `{id, title}` | Videos, shown at the top of the project page (`https://www.youtube-nocookie.com/embed/<id>`) |
| `documents` | list of `{label, url, pages}` | Reports and papers (linked, not stored here) |

The Markdown **body** after the front matter is the full write-up. It uses `##` section headings (Overview, What I built, Results, …); no `#` title, since the page renders `title` itself.

## Media rules
- Images: JPEG or WebP, ≤ ~1600 px on the long side, ideally < 300 KB each. Git keeps every version forever, so keep them small.
- **Videos are never committed.** Upload to YouTube (unlisted is fine) and add the id to `youtube:`.
- Large documents (e.g. the 146-page FSI report) are linked under `documents:`, not copied here.

## Editing
Jake owns this folder; see `CONTRIBUTING.md`. To change text, edit the `project.md`. To add a project, copy any folder, rename it, and update the fields.
