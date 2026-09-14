# API reference — `TangramClient`

Tutti i metodi sono documentati come sono **realmente implementati** in [`lib/tangram.ts`](../lib/tangram.ts), non come dovrebbero essere: dove implementazione e intento divergono c'è una nota 🐞 e un rimando a [known-issues.md](known-issues.md).

Salvo diverse indicazioni: metodo `async`, `POST` JSON, body con `api_key` + `client_id`, risposta `res.json()`, **errore HTTP → eccezione**.

## Costruttore

```js
const client = new TangramClient(apiKey, customerName);
```

| Parametro | Tipo | Note |
|---|---|---|
| `apikey` | `string` | credenziale cliente Compress |
| `customer_name` | `string` | nome cliente; genera `client_id = "<customer_name>_client"` |

Lancia in background `get_credential()` per popolare `credentials` e `customerId`. **Non attende** → vedi [race nel costruttore](known-issues.md#race-nel-costruttore).

---

## Account e storage

### `get_credential()`
`POST /external/credentials` · body `{api_key, client_id}` → oggetto credenziali (include `customer_id`). Chiamato in automatico dal costruttore.

### `get_zone()`
`POST /external/customers/s3` · body `{api_key, client_id}` → `{data: {zone, bucket_upload, access_key, host}}`.
**Da chiamare prima di un upload Evaporate** (lo fa già `upload()`).

### `get_s3_space()`
`POST /external/upload/s3_space` · body `{api_key, client_id}` → spazio occupato/disponibile, es. `{"total": 4608, "used": 1965}` (in `data`).

---

## Categorie

### `get_categories()`
`POST /external/upload/categories` · body `{api_key, client_id}` → lista categorie del cliente (`[{id, name}, …]`, come usata in `example.js`).

### `create_category(category_name)`
`POST /external/upload/categories` · body `{api_key, client_id, category_name}`.
🐞 **Usa il path di lettura**: la costante `CREATE_CATEGORY` (`…/categories/create`) è definita ma non usata. Vedi [known-issues.md](known-issues.md#endpoint-sbagliati).

---

## Upload e VOD

Per scegliere tra i due flussi vedi [upload-flows.md](upload-flows.md).

### `upload({file, title, tags, location, category_id, onStart, onProgress, onComplete, onError})`
Upload multipart con **Evaporate** + encoding. Non `await`abile in modo utile: **non ritorna** l'esito, comunica solo via callback.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `file` | `File` | — | dal `<input type="file">`; `file.name` viene `.trim()`-ato |
| `title` | `string` | `""` | |
| `tags` | `string` | `""` | |
| `location` | `string` | `""` | mappato su `location` in `encode()` |
| `category_id` | `number\|string` | — | convertito con `parseInt` |
| `onStart` | `fn()` | `console.log` | |
| `onProgress` | `fn(percent, status)` | `console.log` | `percent` è 0..1 (in `example.js` viene moltiplicato per 100) |
| `onComplete` | `fn(uploadResponse)` | `console.log` | riceve la risposta di `encode()` |
| `onError` | `fn(error)` | `console.log` | |

Sequenza: `get_zone()` → `Evaporate.create({signerUrl, signHeaders:{tangram_key}, aws_url:host, aws_key:access_key, bucket:bucket_upload, computeContentMd5:true, progressIntervalMS:1000})` → `evaporate.add(...)` → al `complete` chiama `encode(...)`.
⚠️ Un'eccezione prima di `evaporate.add` viene solo loggata (`console.log("failed to upload", e)`) e **non** propagata a `onError`.

### `upload_s3({file, title, tags, location, category_id})`
Upload semplice con **URL presigned** + encoding. **Ritorna** un oggetto, non lancia:

```js
{ response: "OK" | "KO", message: <messaggio o errore> }   // in caso di KO
// in caso di OK: la risposta di encode()
```

Sequenza: `POST /external/upload/presignedUrl` con `{api_key, client_id, filename}` → se `response == "OK"` fa `PUT` del file all'URL in `message` → `encode(..., region)`.

### `encode(uploaded_filename, file, title, tags, location_place, category_id, zone)`
`POST /external/upload/create` — crea il job di encoding. Chiamata internamente dai due upload; usarla direttamente solo se il file è già su S3.

Body: `{api_key, title, tags, category: parseInt(category_id), location, filename, size: parseInt(file.size), reporter_email: "<customer_name>@tngrm.io", region: zone}`.
⚠️ Non manda `client_id`; `reporter_email` è **hardcoded**.

### `add_video_thumb(file_thumb, jobid)`
`POST /external/upload/add_thumb` in **multipart** (`FormData` con `api_key`, `client_id`, `file`, `jobid`).

### `get_uploads(start_from, amount, title, category_name, tags)`
`POST /external/upload` · body `{api_key, client_id, start_from: parseInt, amount: parseInt, q: title, category: category_name, tags}` → lista upload.
Solo `start_from` e `amount` sono obbligatori: `get_uploads(0, 50, null, null, null)`.

### `get_single_upload(jobid)`
`POST /external/upload/jobid` · body `{api_key, jobid}` (senza `client_id`) → dettaglio upload.

### `get_jobid_progress(job_id)`
`POST /external/upload/job_progress/jobid` · body `{api_key, job_id}` → stato di avanzamento dell'encoding.

### `set_published_upload(jobid, published)`
`POST /external/upload/set_published` · body `{api_key, jobid, published}` → pubblica/depubblica il video.

### `get_sign_s3_url()`
Sincrono. Ritorna la URL del signer (`<base>/external/upload/sign_s3_url`) usata da Evaporate.

---

## Restreamer

### `get_restreamers(start_from, amount)`
`POST /external/restreamers` → lista restreamer (paginata, `parseInt` su entrambi).

### `get_restreamers_ott_all(start_from, amount)`
`POST /external/restreamers/ott_all` → lista restreamer OTT.

### `get_restreamer(instance_name)`
`POST /external/restreamers/single_instance` · body `{api_key, client_id, instance_name}` → singola istanza in esecuzione.

### `get_running_instances()`
`POST /external/restreamers/running_instances` → istanze attive del cliente.

### `scale_restreamer(instance_name, scale)`
`POST /external/restreamers/scale_instance` · body `{api_key, client_id, instance_name, scale}`.

---

## Streaming (HLS / push / pull)

### `restreamer_hls_start(instance_name, stream_protocol)` · `restreamer_hls_stop(instance_name, stream_protocol)`
`POST /external/restreamers/hls/start` | `/hls/stop` · body `{api_key, client_id, instance_name, stream_protocol}`.

### `restreamer_push_start(instance_name, external_servers)` · `restreamer_push_stop(...)`
`POST /external/restreamers/push/start` | `/push/stop` · body `{api_key, client_id, instance_name, external_servers}`.
`external_servers` è un array di oggetti costruibili con [`createExternalServer()`](#createexternalserveraudio_channel-ingest_protocol-external_server):

```js
[{ external_server: "rtmp://…", ingest_protocol: "rtmp", audio_channel: "1" }, …]
```

### `restreamer_pull_start(instance_name, external_servers)` · `restreamer_pull_stop(...)`
`POST /external/restreamers/pull/start` | `/pull/stop`. Qui `external_servers` è `[{process_id}]`.
⚠️ Marcati nel sorgente `TODO: need to understand if is used or no` — **non darli per supportati** lato API.

---

## Eventi

### `createEvent(instance_name, event_name, protocol)`
Sincrono, puro. Ritorna `{instance_name, protocol, event_name, customer_id}` oppure **`null`** se `protocol` non è `rtmp`/`srt`.
⚠️ `customer_id` viene da `this.customerId`, che è `undefined` finché `get_credential()` non si è risolta.

### `bulk_events_create(instances)`
`POST /external/events/create_bulk` · body `{api_key, client_id, instances}` — `instances` è un array di oggetti prodotti da `createEvent()`.

### `get_events_history(start_from, amount)`
`POST /external/events/history` · body `{api_key, client_id, start_from, amount}` (qui **senza** `parseInt`) → storico eventi.

### `live_to_vod(title, event_id, instance_name, category)`
Dovrebbe generare un VOD da un evento live.
🐞 **Fa POST su `/external/events/history`**, non su `/external/events/generate_vod` (`LIVE_TO_VOD` è definita ma inutilizzata). Body: `{api_key, client_id, title, event_id, instance: instance_name, category, location: "", thumbnails_number: "0", protocol: ""}`. Vedi [known-issues.md](known-issues.md#endpoint-sbagliati).

---

## Helper

### `isValidProtocol(protocol)`
`true` solo per `"rtmp"` o `"srt"`.

### `createExternalServer(audio_channel, ingest_protocol, external_server)`
Ritorna `{external_server, audio_channel, ingest_protocol}` o **`null`** se `ingest_protocol` non è valido. Da passare a `restreamer_push_start/stop`.

---

## Costanti esportate

Da [`lib/constants.ts`](../lib/constants.ts): `TNGRM_BASE_URL` e tutti i path, più:

### `PERMITTED_FILE_EXTENSIONS`
`.mov .mpeg1 .mpeg2 .mpeg4 .mp4 .mpg .avi .wmv .flv .3gpp .webm .prores .h265 .hevc`
⚠️ **Mai applicata dal client**: la validazione dell'estensione è a carico del chiamante.
