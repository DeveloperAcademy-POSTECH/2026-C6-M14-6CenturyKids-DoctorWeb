# SocDoc clinical reading system

Audience: physicians reviewing patient-reported records before a consultation.
Experience: identify the patient, understand the selected seven-day context, compare pain and symptom patterns, then read the patient's original words.

## Foundation

Existing React 18, Fluent UI controls, Phosphor icons and self-hosted Pretendard. Preserve the patient directory, identity/summary surface, two pain/symptom columns and full-width previsit panel.

Applied UI/UX Pro Max searches: Healthcare Dashboard (product), Data-Dense Dashboard and Drill-Down Analytics (style), dashboard information hierarchy (ux), derived data (React). The generated landing pattern and display-serif typography were unsuitable for this established clinical product and were not used.

## Rules

- White record surfaces on a quiet neutral canvas. Green identifies selection and records; error color is reserved for actual loading/authentication errors.
- Titles 600, body 400, metadata 500; tabular numerals. Patient name is the page heading. Labels 12px, body 15–16px with 1.8 line height.
- Panels 20px radius, controls 8px, tags 6px; restrained shadows. No decorative entrances or delayed keyboard interactions.
- One shared date control. Summaries and both record panels use the same selected window. Do not mix lifetime totals into this context.
- Summary contains recorded days, pain events and maximum recorded pain. Missing pain remains missing, never zero.
- Remove review counters, badges, review filters and warning markers. Preserve original answers and their recorded values.
- Desktop retains a previsit shortcut; mobile retains three record anchors because panels stack vertically.
- Patient selection returns focus and reading position to the new identity. Drawer traps focus and supports Escape.
- Keep before/after trend differentiated by solid/dashed lines and markers, and symptom states by dot/dash/question mark plus a legend. Never connect missing data.

## Validation

Production build, 20 existing/domain tests, keyboard and browser behavior checks; verify 375/768/1024/1440 widths. Contrast and heading hierarchy checked explicitly. No live patient server exercised.

## Detail refinement

- Symptom table rows use 44px content slots plus a 1px separator; all eight rows measure 45px. Dot, minus, unknown and missing states share the same slot.
- Answer rows use 16px padding on every side and 6px paragraph gaps. Targeting changes surface treatment without changing geometry.
- Selected patients use a neutral border, with no colored edge or inset shadow.
- Literal Phosphor medicine, conversation and note icons replace the decorative heart symbol.
- Recharts supplies the responsive linear comparison chart, keyboard tooltip and accessible data table. Missing values remain gaps; zero values remain real zeros. Chart code loads separately from the workspace.
- Decrease/increase uses down/up arrows plus a numeric value and accessible text.
- Previsit order is communication preference, attached records, then original message. The grid allocates only the rows actually needed.
- Latest-period return sits to the left of the date capsule; the capsule contains previous, range/context and next.
- Final validation: production build, 23 tests, no page overflow from 320 to 1440px, uniform rows across all tested widths, keyboard chart tooltip and attachment navigation.
