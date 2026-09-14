# Documentazione `compress-nodejs`

Hub della documentazione tecnica dell'SDK client della **Compress API** di HiWay Media.

- **Audience**: sviluppatori che integrano la piattaforma Compress in un frontend (upload video, gestione restreamer/eventi live) e manutentori dell'SDK.
- **Scope**: la libreria `compress-nodejs` (`lib/`), il suo build/publish e il contratto verso `api-compress.hiway.media`. **Non** documenta il backend Compress, che vive altrove.
- **Repository**: [`github.com/HiWay-Media/compress-nodejs`](https://github.com/HiWay-Media/compress-nodejs) — npm: [`compress-nodejs`](https://www.npmjs.com/package/compress-nodejs)
- **Regole per agent AI**: [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md)

> ⚠️ **Il nome inganna**: nonostante `nodejs`, è una libreria **browser**. Usa `fetch`, `FormData`, `File` e `Evaporate` (multipart upload S3 lato browser) e si consuma come global UMD `TangramClient`. Non c'è runtime Node, niente CLI, niente test.

---

## 🚀 Quick start — "Voglio fare X..."

| Se vuoi... | Vai a |
|---|---|
| Capire com'è fatta la libreria e come si costruisce il bundle | [architecture.md](architecture.md) |
| Cercare la firma di un metodo, cosa manda e cosa torna | [api-reference.md](api-reference.md) |
| Caricare un video (e capire quale dei due upload usare) | [upload-flows.md](upload-flows.md) |
| Buildare, versionare, pubblicare su npm | [build-release.md](build-release.md) |
| Sapere cosa è rotto/insidioso prima di toccare il codice | [known-issues.md](known-issues.md) |
| Provare la libreria a mano | `npm run build` poi apri `../index.html` (vedi [upload-flows.md](upload-flows.md#provare-in-locale)) |

---

## Mappa del repository

```
compress-nodejs/
├── lib/
│   ├── tangram.ts        # class TangramClient — tutta la libreria (~1000 righe)
│   └── constants.ts      # path degli endpoint + PERMITTED_FILE_EXTENSIONS
├── dist/                 # output microbundle — NON versionato (.gitignore)
├── index.html            # pagina demo: carica dist/compress.umd.js
├── example.js            # esempio d'uso completo (connect, categorie, upload)
├── docs/                 # questa documentazione
├── .github/workflows/
│   ├── npm.yml           # CI build su ogni push (Node 20.x / 21.x)
│   └── npm-package.yml   # GitHub Release → zip asset + npm publish
└── .husky/commit-msg     # hook commitlint (⚠ senza config, vedi known-issues)
```

## Concetti

| Termine | Significato |
|---|---|
| **Tangram / TNGRM** | Vecchio brand della piattaforma, oggi **Compress**. Sopravvive nel nome della classe (`TangramClient`), nella costante `TNGRM_BASE_URL`, nell'header `tangram_key` e nell'email `@tngrm.io` generata da `encode()`. Stessa cosa, nome diverso. |
| **`api_key`** | Credenziale del cliente. Viaggia **nel body JSON** di ogni richiesta, non in un header (eccezione: Evaporate la manda come header `tangram_key` al signer). |
| **`client_id`** | Derivato, non configurabile: `` `${customer_name}_client` ``. |
| **`jobid`** | Identificativo di un job di encoding, restituito da `encode()` e usato da `get_single_upload`, `get_jobid_progress`, `set_published_upload`, `add_video_thumb`. |
| **zone / region** | Zona S3 del cliente (`get_zone()`), necessaria a Evaporate (bucket, host, access key) e rimandata indietro a `encode()`. |
| **restreamer / instance** | Istanza di streaming live, identificata da `instance_name`; scalabile e pilotabile via HLS/push/pull. |
