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

## Architecture
- All demo data lives in src/data/mock.ts (seeded) and is mutated only via src/lib/store.ts so every page shows consistent numbers.
- Every table/list uses src/components/app/DataTable.tsx (URL-persisted pagination/filters) — never build ad hoc tables.
- Authenticated pages live under the pathless `_app` layout (shell, MiningScene, assistant); the login is `/`.
- Simple module pages compose ModulePage/ActionDialog from src/components/app/Module.tsx.
- Workflow actions go through `cascade()` in src/lib/cascade.ts (snapshot → effects → notifications/audit → one undo toast); cascades live in src/lib/actions.ts. Why: one connected system with full-chain undo.
- KPIs in src/data/mock.ts are getters derived from entity arrays; never hardcode counts. Why: every page/badge stays consistent after actions.
