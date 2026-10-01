<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules
- Norms are data (standards → chapters → requirements tables), never hardcoded in UI; new norms are added via SQL seed/admin. Why: one questionnaire/report engine serves every norm.
- Roles live in user_roles (admin/auditor/empresa); new signups get "empresa" via trigger. Why: avoids privilege escalation.
- Compliance % = (cumple=1, parcial=0.5, no_cumple=0, no_aplica excluded) weighted by requirement.weight, computed client-side in src/lib/assessment.ts. Why: single scoring source.
- PDF report uses browser print with `.no-print` classes. Why: no server-side PDF runtime needed.
