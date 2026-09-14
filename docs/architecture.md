# Architettura

## Vista d'insieme

```
  ┌───────────────────────────────────────────────────────────────────┐
  │ BROWSER del cliente                                               │
  │                                                                   │
  │   <script src="dist/compress.umd.js">   → window.TangramClient    │
  │            │                                                      │
  │            ▼                                                      │
  │   new TangramClient(api_key, customer_name)                       │
  │            │  client_id = `${customer_name}_client`               │
  │            │  constructor → get_credential()  (async, NON atteso) │
  │            │                    └→ this.credentials, customerId   │
  │            │                                                      │
  │   ┌────────┴──────────┬──────────────────────┐                    │
  │   ▼                   ▼                      ▼                    │
  │  fetch(JSON)      Evaporate (S3 multipart)  fetch(FormData)       │
  └───┼───────────────────┼──────────────────────┼────────────────────┘
      │                   │                      │
      ▼                   ▼                      ▼
  ┌─────────────────────────────────┐   ┌──────────────────────┐
  │ Compress API                    │   │ Storage S3/MinIO     │
  │ api-compress.hiway.media/api/v4 │◄──┤ (host/bucket dati    │
  │  /external/upload/…             │   │  da get_zone())      │
  │  /external/restreamers/…        │   └──────────────────────┘
  │  /external/events/…             │
  │  /external/credentials, customers/s3
  └─────────────────────────────────┘
```

## Sorgenti

| File | Ruolo |
|---|---|
| [`lib/constants.ts`](../lib/constants.ts) | Solo costanti: `TNGRM_BASE_URL` (= `API_ENDPOINT`, injectata a build time), i path degli endpoint raggruppati per area, `PERMITTED_FILE_EXTENSIONS`. **Ogni nuovo endpoint va qui**, mai inline. |
| [`lib/tangram.ts`](../lib/tangram.ts) | L'intera libreria: una sola classe `TangramClient`, export default. Nessun modulo interno, nessuna gerarchia. |

## Pattern delle chiamate

Tutti i metodi API seguono lo stesso schema, senza eccezioni:

```ts
async metodo(args) {
  return await fetch(TNGRM_BASE_URL + COSTANTE, {
    method: "POST",                                   // sempre POST, anche per le letture
    headers: { "Content-Type": "application/json" },  // nessun header di auth
    body: JSON.stringify({
      api_key: this.api_key,                          // auth nel body
      client_id: this.client_id,
      ...parametri
    }),
  }).then((res) => {
    if (!res.ok) throw new Error(`something went wrong …, ${res.status} ${res.statusText}`);
    return res.json();
  });
}
```

Conseguenze pratiche:

- **Errore = eccezione**, non un valore di ritorno. Ogni chiamata va in `try/catch` o `.catch()`. Le uniche due deroghe sono `upload_s3()` (ritorna `{response:"KO"}`) e `upload()` (usa callback) — vedi [upload-flows.md](upload-flows.md).
- **Un 4xx/5xx non porta con sé il body**: il messaggio dell'eccezione contiene solo status e statusText, il payload d'errore dell'API viene perso.
- I messaggi d'errore sono **copiati/incollati** tra metodi (molti dicono "during get categories"): non usarli per capire dove è fallito. Vedi [known-issues.md](known-issues.md).
- Non c'è retry, timeout, cancellazione né deduplica: tutto a carico del chiamante.

### Le tre eccezioni al pattern

1. **`add_video_thumb()`** manda `FormData` (multipart), non JSON: il `Content-Type` lo imposta il browser.
2. **`upload()`** non chiama `fetch` per il trasferimento: delega a **Evaporate**, che firma ogni part chiamando `SIGNER_URL` (= `/external/upload/sign_s3_url`) con l'header `tangram_key: api_key`. È l'unico punto dove l'api_key sta in un header.
3. **`upload_s3()`** fa un `PUT` diretto all'URL presigned restituito dall'API — richiesta verso S3, non verso Compress.

## Stato dell'istanza

| Campo | Quando è valorizzato |
|---|---|
| `api_key`, `customer_name`, `client_id` | subito, nel costruttore |
| `SIGNER_URL` | subito (campo con inizializzatore) |
| `credentials`, `customerId` | **dopo** che la `get_credential()` lanciata dal costruttore si è risolta |

⚠️ Il costruttore **non attende** `get_credential()` e non espone una promise di "ready". Subito dopo `new TangramClient(...)`, `customerId` è `undefined` — e `createEvent()` lo legge. Workaround: attendere una qualsiasi chiamata async (es. `await client.get_categories()`) prima di costruire eventi. Vedi [known-issues.md](known-issues.md#race-nel-costruttore).

## Build

```
 lib/tangram.ts (source)
        │
        │  microbundle --name TangramClient --define API_ENDPOINT=<url>
        ▼
 dist/compress.js         → package.json "main"   (CJS)
 dist/compress.module.js  → package.json "module" (ESM)
 dist/compress.modern.mjs → ESM moderno
 dist/compress.umd.js     → package.json "unpkg"  (browser, global TangramClient)
 dist/*.d.ts              → tipi generati
 dist/*.map               → sourcemap
```

`API_ENDPOINT` è dichiarata come `declare var` in `constants.ts` e **sostituita a compile time** da microbundle: non è una variabile d'ambiente runtime, non è sovrascrivibile dal consumer. Cambiare ambiente = ricostruire. Vedi [build-release.md](build-release.md).
