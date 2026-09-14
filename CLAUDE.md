# CLAUDE.md — compress-nodejs

SDK client della **Compress API** di HiWay Media (`github.com/HiWay-Media/compress-nodejs`, npm `compress-nodejs`): una singola classe `TangramClient` (`lib/tangram.ts`) che espone upload video, encoding, restreamer e eventi live. Build con **microbundle** → `dist/` (CJS + ESM + UMD + `.d.ts`), pubblicata su npm da GitHub Actions al `release: published`.

⚠️ **Il nome inganna: è una libreria BROWSER, non Node.** Usa `fetch`, `FormData`, `File`, `Evaporate` (multipart upload S3 lato browser) e si consuma come global UMD `TangramClient` (vedi `index.html`). Non c'è runtime Node, niente CLI, niente test.

## Architettura

```
  lib/constants.ts ──(path API + estensioni permesse)──┐
                                                       ▼
  lib/tangram.ts  →  class TangramClient(api_key, customer_name)
        │                 │
        │                 ├── client_id = `${customer_name}_client`
        │                 └── constructor → get_credential() → customerId   (async, NON atteso)
        │
        │  microbundle --define API_ENDPOINT=<url>
        ▼
  dist/compress.js (main/CJS) · compress.module.js (ESM) · compress.umd.js (unpkg/browser) · *.d.ts

  ── flusso upload (2 varianti) ───────────────────────────────────────────
  upload({file,…})        → get_zone() → Evaporate.create(signerUrl=/sign_s3_url)
                            → evaporate.add(started/progress/complete/error)
                            → complete → encode()  → job sulla piattaforma Compress
  upload_s3({file,…})     → /presignedUrl → PUT diretto all'URL firmato
                            → encode()                  (stessa coda di encoding)
```

Tutte le chiamate seguono lo stesso schema: `POST {TNGRM_BASE_URL}{PATH}` con body JSON `{api_key, client_id, …}`, `res.ok` → `res.json()`, altrimenti `throw new Error(...)`. **Non c'è header di auth**: l'`api_key` viaggia nel body (eccezione: Evaporate usa `signHeaders: { tangram_key }`).

### Superficie pubblica (`lib/tangram.ts`)

| Area | Metodi |
|---|---|
| Account/storage | `get_credential`, `get_zone`, `get_s3_space` |
| Categorie | `get_categories`, `create_category` |
| Upload/VOD | `upload`, `upload_s3`, `encode`, `add_video_thumb`, `get_uploads`, `get_single_upload`, `get_jobid_progress`, `set_published_upload`, `get_sign_s3_url` |
| Restreamer | `get_restreamers`, `get_restreamers_ott_all`, `get_restreamer`, `get_running_instances`, `scale_restreamer` |
| Streaming | `restreamer_hls_start/stop`, `restreamer_push_start/stop`, `restreamer_pull_start/stop` |
| Eventi | `createEvent`, `bulk_events_create`, `get_events_history`, `live_to_vod` |
| Helper | `isValidProtocol` (solo `rtmp`/`srt`), `createExternalServer` |

## Regole di lavoro (SEMPRE)

- **`API_ENDPOINT` è una define di build, non una env runtime.** `npm run build` → **prod** `https://api-compress.hiway.media/api/v4.0`; `npm run dev` (watch) → **dev** `https://api-compress.hiwaymedia.dev/api/v4.0`. Un `dist/` costruito con `dev` e pubblicato punta l'SDK di tutti i clienti all'ambiente sbagliato: prima di `npm publish`/release, **ricostruire sempre con `npm run build`**.
- **Nuovo endpoint API = nuova costante in `lib/constants.ts`**, mai URL inline nei metodi.
- **Bump di versione in 3 punti**: `package.json`, header `v1.0.x` in cima a `lib/tangram.ts`, tag git `vX.Y.Z`. Oggi: `package.json` 1.0.3, header `tangram.ts` ancora `v1.0.2` — disallineato, riallinearlo quando si tocca.
- **MAI `git push`** — lo fa sempre l'utente. MAI `Co-Authored-By` nei commit.
- **`dist/` non è versionata** (`dist` è in `.gitignore`) ma esiste in locale ed è referenziata da `index.html`. Dopo una modifica a `lib/`, per provare l'esempio serve `npm run build` (o `npm run dev`).
- **Branch di lavoro: `dev`**; `main` è il default/PR target. La pubblicazione npm parte **solo** da una GitHub Release pubblicata (`.github/workflows/npm-package.yml`), non dal push.
- **Aggiornare `README.md` + `example.js`/`index.html`** quando cambia la firma di un metodo pubblico: sono l'unica documentazione utente e l'unico "test" del repo.

## Trappole note / bug aperti

- 🐞 **Dipendenze invertite in `package.json`**: `evaporate`, `crypto-js`, `jssha`, `tslib` stanno in `devDependencies` mentre `microbundle` (build tool) sta in `dependencies`. Il bundle importa `evaporate` e `crypto-js` → chi installa il pacchetto da npm **non li riceve**: funziona solo con il UMD (che li inlina) o se il consumer li ha già. Non "sistemare" al volo senza verificare cosa fa microbundle con gli externals — è un cambio di packaging, va testato con `npm pack`.
- 🐞 **`live_to_vod()` fa POST su `EVENTS_HISTORY`**, non su `LIVE_TO_VOD` (`/external/events/generate_vod`): la costante è definita ma inutilizzata.
- 🐞 **`create_category()` fa POST su `GET_CATEGORIES`**, non su `CREATE_CATEGORY` (`…/categories/create`).
- ⚠️ **Race nel costruttore**: `get_credential()` è lanciata senza `await`, quindi `this.credentials`/`this.customerId` possono essere `undefined` subito dopo il `new`. `createEvent()` ci si appoggia → chiamarlo troppo presto produce `customer_id: undefined`. Nessuna API pubblica di "ready": se serve, attendere una chiamata async (es. `get_categories()`) prima di usare gli eventi.
- ⚠️ **Messaggi d'errore copiati/incollati**: molti `throw` dicono "during get categories"/"get uploads" anche in metodi diversi. Quando si tocca un metodo, correggere il messaggio; non fidarsi del testo dell'errore per localizzare il punto di fallimento.
- ⚠️ `PERMITTED_FILE_EXTENSIONS` è esportata ma **non viene mai applicata** dal client: la validazione dell'estensione è a carico del chiamante (o dell'API).
- ⚠️ **Hook husky `commit-msg` → `npx commitlint --edit`, ma nel repo non c'è nessuna config commitlint** né il pacchetto tra le dipendenze: il commit può fallire o far scaricare a npx un pacchetto arbitrario. Se blocca, `--no-verify` o aggiungere una `commitlint.config.js` vera.
- ⚠️ `upload()` **non ritorna** l'esito: comunica solo via callback `onStart/onProgress/onComplete/onError`, e in caso di eccezione fa `console.log("failed to upload")` senza rilanciare. `upload_s3()` invece ritorna `{response: "OK"|"KO", message}`. Due contratti diversi, non uniformarli senza un bump major.
- ⚠️ `reporter_email` in `encode()` è hardcoded a `${customer_name}@tngrm.io` (retaggio del vecchio brand "Tangram" → Compress).
- ⚠️ `restreamer_pull_start/stop` sono marcati `TODO: need to understand if is used or no` — non darli per supportati lato API.
- CI `npm.yml` gira su Node 20.x/21.x e fa `npm i && npm run prepare && npm run build` (`prepare` a sua volta chiama `build`: doppia build, normale). **Non c'è `npm test`** — il repo non ha suite di test.
- Ci sono 3 PR dependabot aperte (`nanoid`, `rollup`, `xml2js/aws-sdk`): sono transitive di microbundle/evaporate, non vanno mergiate alla cieca senza una build di verifica.

## Puntatori

- Sorgenti: `lib/tangram.ts` (client, ~1000 righe, classe unica) · `lib/constants.ts` (path API + estensioni)
- Esempio funzionante: `index.html` + `example.js` (aprire l'HTML dopo `npm run build`; serve `dist/compress.umd.js`)
- CI/CD: `.github/workflows/npm.yml` (build su ogni push) · `.github/workflows/npm-package.yml` (release → zip asset + `npm publish`, usa `secrets.NPM_TOKEN`)
- Convenzioni file: `.editorconfig` (2 spazi, LF, UTF-8, newline finale)
- Repo affini: `compress-bot`, `devops_hiway` (infrastruttura), API backend Compress `api-compress.hiway.media`
