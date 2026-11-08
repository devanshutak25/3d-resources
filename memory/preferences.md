# Preferences

User working style + collab rules.

- Communication: caveman lite mode (tight, no filler, no hedging).
- Animations: always run, ignore prefers-reduced-motion.
- Closed-enum vocab: never invent new values without asking.
- Validate before commit: `node scripts/validate.js` must pass.
- User-facing text: NO em-dashes, NO AI tells (`comprehensive/robust/powerful/seamless/leverage/utilize/cutting-edge/state-of-the-art/the ultimate/and more/and beyond`). Full rules in `CLAUDE.md` § "Writing style". Set 2026-05-18.

(append as learned)
- 2026-10-05: For multi-batch maintenance work the user may pre-approve all batches ("don't wait after every batch"). Then run, commit and push each batch without stopping; still report at the end.
- 2026-10-05: For discovery/add tasks user said "don't wait for me, use your judgement, add as many as you can find". Add verified + deduped items directly; still stop between phases.
- 2026-10-31: For UI work the user wants a localhost server running in-session to test (_site on :8080).
- 2026-11-03: Never send the user's email/personal identifiers to external services (agents included). Put this in every research-agent brief.
- 2026-11-09: Studio discovery = country-wise agents, one region per session (Europe done 2026-11-09; user will run other regions in later sessions). Method: docs/playbooks/studio-discovery.md.
