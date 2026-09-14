# Build, versionamento e release

## Script npm

| Comando | Cosa fa |
|---|---|
| `npm run build` | `microbundle --name TangramClient --define API_ENDPOINT=https://api-compress.hiway.media/api/v4.0` → **PROD** |
| `npm run dev` | `microbundle watch … --define API_ENDPOINT=https://api-compress.hiwaymedia.dev/api/v4.0` → **DEV**, in watch |
| `npm run prepare` | alias di `build` (gira dopo `npm i` e prima del publish) |
| `npm run prepublishOnly` | alias di `build` (ultima rete di sicurezza prima di `npm publish`) |

Non esiste `npm test`: **il repo non ha suite di test**. La verifica è manuale via `index.html` (vedi [upload-flows.md](upload-flows.md#provare-in-locale)).

## ⚠️ L'endpoint è compilato dentro il bundle

`API_ENDPOINT` è dichiarata `declare var` in [`lib/constants.ts`](../lib/constants.ts) e sostituita **a compile time** da microbundle. Non è una variabile d'ambiente, non è sovrascrivibile dal consumer, non è cambiabile a runtime.

```
 npm run build  →  dist/*  cablato su  api-compress.hiway.media      (PROD)
 npm run dev    →  dist/*  cablato su  api-compress.hiwaymedia.dev   (DEV)
```

**Conseguenza**: un `dist/` prodotto con `npm run dev` e poi pubblicato punterebbe l'SDK di *tutti* i clienti sull'ambiente di sviluppo. Prima di qualunque release, **ricostruire sempre con `npm run build`**. `prepublishOnly` protegge il `npm publish` manuale, ma non protegge un `dist/` già presente che venga zippato/copiato a mano.

## Output

`dist/` **non è versionata** (`dist` compare in `.gitignore`), ma è referenziata da `index.html`: dopo ogni modifica a `lib/` va ricostruita per provare l'esempio.

| File | Campo in `package.json` | Uso |
|---|---|---|
| `dist/compress.js` | `main` | CommonJS |
| `dist/compress.module.js` | `module` | ESM (bundler) |
| `dist/compress.modern.mjs` | — | ESM moderno |
| `dist/compress.umd.js` | `unpkg` | `<script>` diretto, global `TangramClient` |
| `dist/*.d.ts` | — | tipi (`tangram.d.ts`, `constants.d.ts`) |

`package.json` → `files: ["dist/**/*"]`: **solo `dist/` finisce nel pacchetto npm**, i sorgenti no (il campo `source` punta comunque a `lib/tangram.ts`).

## Versionamento

Una versione va allineata in **tre** punti:

1. `version` in [`package.json`](../package.json)
2. l'header `* v1.0.x` in cima a [`lib/tangram.ts`](../lib/tangram.ts)
3. il tag git `vX.Y.Z`

> Stato attuale: `package.json` = **1.0.3**, header `tangram.ts` = **v1.0.2** → disallineati. Riallineare l'header alla prossima modifica del file.

Tag esistenti: `v0.4.x` → `v0.5.0x` → `v1.0.1`, `v1.0.3` (`v1.0.2` non taggata).

## Branch

- **`dev`** — branch di lavoro.
- **`main`** — default branch e target delle PR.
- Branch `dependabot/*` aperti su `nanoid`, `rollup`, `xml2js`+`aws-sdk`: sono transitive di microbundle/evaporate, **non mergiarle alla cieca** senza una build di verifica.

🚫 **Mai `git push` da un agent**: lo fa sempre l'utente.

## CI/CD (GitHub Actions)

### `.github/workflows/npm.yml` — build su ogni push

```
push (qualsiasi branch)
  → matrix Node 20.x, 21.x
  → npm i  →  npm run prepare  →  npm run build      (prepare richiama build: doppia build, normale)
  → upload-artifact "build-artifacts" (dist/**)
```

### `.github/workflows/npm-package.yml` — publish su release

```
GitHub Release: published
  → checkout, setup-node 20.x (registry npmjs)
  → tag = ${GITHUB_REF#refs/*/}
  → npm i → npm run prepare → npm run build          (⇒ endpoint PROD)
  → zip -r compress-nodejs-<tag>.zip dist/
  → upload-release-asset  (GITHUB_TOKEN)
  → npm publish           (secrets.NPM_TOKEN)
```

**Il publish non parte dal push**: il trigger su `push` è commentato. L'unico modo di pubblicare è **creare e pubblicare una GitHub Release**.

## Procedura di release

1. Merge del lavoro su `dev` → PR verso `main`.
2. Bump dei 3 punti sopra (`package.json`, header `tangram.ts`, tag).
3. Aggiornare `README.md`/`example.js` se sono cambiate firme pubbliche, e questa cartella `docs/`.
4. `git tag -a vX.Y.Z -m "Release X.Y.Z"` — **push e creazione della Release le fa l'utente**.
5. La Release pubblicata fa partire `npm-package.yml`: zip asset + `npm publish`.
6. Verifica: `npm view compress-nodejs version` e che il bundle punti all'endpoint prod (`grep -o 'api-compress[^"]*' dist/compress.umd.js`).

## Hook locali

`.husky/commit-msg` → `npx commitlint --edit $1`.
⚠️ **Nel repo non c'è nessuna config commitlint** né il pacchetto tra le dipendenze: il commit può fallire o far scaricare a `npx` un pacchetto arbitrario. Se blocca: `git commit --no-verify`, oppure aggiungere una `commitlint.config.js` vera. Vedi [known-issues.md](known-issues.md).
