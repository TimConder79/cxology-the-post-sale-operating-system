# Working With Codex

This repo is set up for fast iteration on a live GitHub Pages site.

Use this guide when you want page edits, copy changes, layout improvements, or a full pass on a section.

## Best Prompt Shape

The most effective prompts include:

- `File:` the page to change, such as `index.html` or `frameworks.html`
- `Task:` what you want improved
- `Audience:` who the page is for
- `Constraints:` what must stay true
- `Push to GitHub:` `yes` or `no`

## Recommended Template

```text
File:
Task:
Audience:
Constraints:
Push to GitHub:
```

## Example Prompts

```text
File: index.html
Task: Make the hero feel more premium and clarify the value proposition for post-sale operations leaders.
Audience: SaaS executives and CS leaders
Constraints: Keep the current navigation, preserve mobile responsiveness, and do not remove Tim's credibility markers.
Push to GitHub: yes
```

```text
File: frameworks.html
Task: Audit this page and fix the three biggest UX issues.
Audience: Customer Success operators evaluating the methodology
Constraints: Keep the existing framework content and links intact.
Push to GitHub: no
```

```text
File: chapter-3.html
Task: Rewrite the opening section so it scans better and sounds more executive-level.
Audience: Revenue leaders
Constraints: Preserve the core meaning and keep the voice confident, not academic.
Push to GitHub: yes
```

## Useful Verbs

These words help me understand how far to go:

- `audit` for diagnosis and prioritized fixes
- `edit` for direct implementation
- `rewrite` for copy changes
- `polish` for visual and spacing improvements
- `ship` for making the change and pushing it

## Good Constraints To Mention

- `Preserve the current information architecture`
- `Do not change the navigation`
- `Keep this section's meaning intact`
- `Make it feel more premium`
- `Improve mobile readability`
- `Leave everything else alone`

## Fast Workflow

For the quickest loop, use:

```text
File: index.html
Task: Improve the hero section for clarity and executive appeal.
Audience: SaaS CEOs and CS leaders
Constraints: Keep the current brand voice and mobile responsiveness.
Push to GitHub: yes
```

I will then:

1. Inspect the relevant file and styles.
2. Make the change directly in the repo.
3. Verify the result as best I can locally.
4. Tell you what changed and note anything that still needs your eye.

## Notes

- If you say `Push to GitHub: yes`, I will prepare the changes for commit/push as part of the task.
- If visual taste matters, phrases like `more premium`, `less busy`, `higher contrast`, or `more executive` are very helpful.
- If a section is precious, say `preserve this exactly`.
