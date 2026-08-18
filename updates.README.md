# Reader Hub updates (`updates.json`)

The "Updates & refinements" feed on `readers.html` (and the "Latest from the system"
cards in its hero) render from `updates.json`. This is the only file you edit to post
an update — no HTML changes needed.

## Add an update

Add one object to the top of the `updates` array:

```json
{
  "kind": "Refinement",
  "chapter": "Ch 12 · The First Value Play",
  "date": "2026-08-20",
  "title": "A sharper First Value checklist",
  "blurb": "One or two sentences describing the update.",
  "link": "#",
  "linkLabel": "See the update"
}
```

Entries are sorted by `date` automatically (newest first), so order in the file
does not matter.

## Fields

| Field       | Required | Notes |
|-------------|----------|-------|
| `kind`      | yes      | One of: `New play`, `Reader Q&A`, `Refinement`, `Errata`. Drives the card color. |
| `date`      | yes      | `YYYY-MM-DD`. |
| `title`     | yes      | The headline. |
| `chapter`   | no       | e.g. `Ch 12 · The First Value Play`. The short form (`Ch 12`) is used in the hero. |
| `blurb`     | no       | Short description shown on the card. |
| `link`      | no       | URL or anchor the card links to. Omit to show no link. |
| `linkLabel` | no       | Link text (default: `Read more`). |

A new `kind` value still renders, just with the default (olive) color. To give it its
own color, add it to the `COLOR` map in the render script inside `readers.html`.
