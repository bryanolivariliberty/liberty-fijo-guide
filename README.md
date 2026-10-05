# Liberty Business — B2B Fijo Sales Tool

Internal sales tool for the Liberty Communications of Puerto Rico B2B team
(fixed services — SOHO & SMB).

## What this is
An interactive rate and services guide, bilingual (ES/EN), including:
- Plan pricing for COAX, FTTx and FMC (1P / 2P / 3P bundles), 2026 Rate Increase
- Limited Time Offers (List / Lead Offer / FMC)
- Standalone internet specials
- Add-ons, voice, video, STB equipment, hardware and managed services
- Promotions (competitor penalty payment, customer referrals)
- 8-step quote builder that produces a branded proposal PDF
- **Auto-filled SOHO contract** ("Solicitud de Servicio") — see below

## File layout
```
guide-fijo.html        app shell — header, tabs, script tags
index.html             password gate (SHA-256, sessionStorage)
one-pager.html         standalone marketing/onboarding sheet
css/styles.css         all styles
js/data.js             ALL pricing data (plans, LTO, add-ons, hardware)
js/i18n.js             ES/EN strings
js/icons.js            inline SVG icons
js/renderers.js        renders the Plans / LTO / Specials / Add-ons / Promos tabs
js/proposal.js         8-step quote flow + proposal PDF (jsPDF)
js/contract.js         SOHO contract auto-fill (pdf-lib)
js/pdf-lib.min.js      pdf-lib 1.17.1, vendored on purpose (no CDN)
assets/contrato-soho.pdf   blank official contract used as the template
```

## Auto-filled SOHO contract (step 8 of the quote)
Step 8 of the quote builder fills the official 2-page "Solicitud de Servicio"
with the rep's selections and downloads it as
`Liberty_Contrato_<Empresa>_<AAAAMMDD>.pdf`.

How it works: `js/contract.js` loads `assets/contrato-soho.pdf` and overlays a
real text layer with pdf-lib. The original document is left untouched — nothing
is redrawn or rasterised, so the form stays crisp and the filled values are
selectable text. Page 2 (the battery-backup legal text) passes through as is.

Things worth knowing before you change it:
- **Coordinates.** `CF` in `js/contract.js` is a map of PDF points measured from
  the TOP of the page. Every value was measured off the template's own vector
  rule grid, including each ○ bullet's centre — the bullets are *not* perfectly
  centred in their cells (up to 1.5 pt of drift), so don't compute them from the
  cell bounds. If the template PDF is ever replaced, these must be re-measured.
- **Bundle price placement.** A quote carries one bundled price, but the contract
  has separate rows for video, internet and telephony. The full bundle price goes
  on the *Internet de alta velocidad* row; the video tier and telephony rows are
  ticked and marked "Incl." This keeps "Total de mensualidad regular" equal to
  the quote total. A note in *Instrucciones especiales* states this explicitly.
- **Colour convention.** Selection marks (every filled bullet) are **red**; data
  text is dark navy; blanks the customer must sign or initial get a translucent
  **yellow highlighter band**. Red matters beyond aesthetics: "Cliente
  nuevo/existente" and "Sencillo/Doble/Triple" have solid *white* bullets on a
  black bar, so a dark dot blends into the bar and reads as unselected — red
  leaves a white ring with a red centre, which reads as filled on both the black
  bars and the white table body.
- **Highlighted blanks** (`CF.hl`) are the contract-term initials, the initials
  of whichever billing method was selected, and the customer's signature line.
  Coordinates come from the document's real underline segments, and each band
  covers only the blank — never the neighbouring text. The rep's own signature
  line is intentionally *not* highlighted; the bands mark what the **customer**
  has to fill in.
- **Servicios Adicionales overflow.** Only 4 usable rows exist. Anything beyond
  that is listed in *Instrucciones especiales* — never silently dropped.
- **Left blank by design:** all signatures and initials.
- Extra fields the quote doesn't collect (addresses, phones, e-mail, Seguro
  Social Patronal, install date/block, converter type, vendor number,
  territory…) are captured by the optional form in step 8.

## Deploying updates
Repo: `github.com/girald25/liberty-fijo-guide` (private) → Vercel auto-deploys
`main` in ~30 seconds.

Deploys are done through GitHub's web uploader (**Add file → Upload files**),
so keep every file **flat inside its existing folder**. The web uploader cannot
create subfolders, and its file picker does not accept folders at all — that is
why `pdf-lib.min.js` sits in `js/` rather than a `js/vendor/` directory. If you
ever do need a new subfolder, create it first via *Add file → Create new file*
and type `subfolder/name.ext` as the filename, then upload into it.

After deploying, hard-refresh (**Ctrl+Shift+R**) — the JS and CSS are cached, so
a normal reload can keep serving the old build.

## To update plans, LTO or promotions
All pricing lives in `js/data.js`:
- `COAX` / `FTTX` — plan pricing per bundle (`list` and `promo`)
- `COAX_LTO` / `FTTX_LTO` — Limited Time Offer table
- `ADDONS`, `ULT_ADDONS`, `HARDWARE`, `FOX_DEPORTES`, `VIDEO_2P_PLANS`
- `FMC_PLANS` is derived automatically from the `fmc` field on each plan

Contract term fees are in `CONTRACT_TERMS` (`js/proposal.js`) and are one-time,
not monthly.

## Access
Protected by password. Share the URL and password with authorized reps only.
Contact your B2B team lead for access credentials.

## Note on `_repo/`
`_repo/` holds the pre-refactor monolithic version (a single 111 KB
`guide-fijo.html` with everything inline). It is not referenced by anything
and can be archived.

---
*Liberty Communications of Puerto Rico · Internal use only*
