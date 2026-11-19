# kissj UI/UX Mockups

Standalone design mockups kept separate from `src/Templates/` so we can iterate on layout, page sections, and integration of `entry-kissj`, `bezpecny-navigamus` (SFH), and `eventApp` without touching production code.

## Structure

- **`alt-1-command-tiles.twig`** — Main Admin Hub organized into 5 clear sections:
  1. **Denní operativa & fronty** (Huge primary `.btn` CTAs + tiles for Schvalování, Finance & platby, Vstup / Entry)
  2. **Lidé, týmy & nastavení** (Účastníci, Guest table, Limity & role)
  3. **Odborné sekce** (Stravování, Zdraví & SOS/SZT, SFH bezpečnostní příprava, Programy & sekce)
  4. **Stav registrací** (Visual funnel bars)
  5. **Externí aplikace & exporty** (`eventApp`, external `IST App`, Exporty & API)
- **`pages/`** — Clickable subpages:
  - `approve.twig` (Schvalování)
  - `payments.twig` (Banka & platby + Finanční report)
  - `entry.twig` (Integrovaný Vstup / Check-in z `entry-kissj`)
  - `participants.twig` (Účastníci + Guest table)
  - `roles.twig` (Limity, role & pole)
  - `food.twig` (Stravování & diety)
  - `safety.twig` (Zdraví & SOS/SZT)
  - `sfh.twig` (Integrovaná bezpečnostní příprava z `bezpecny-navigamus`)
  - `programmes.twig` (Programy, sekce & synchronizace s `eventApp`)
  - `future-app.twig` (Externí IST App & Exporty)
