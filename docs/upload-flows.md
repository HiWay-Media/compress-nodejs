# Flussi di upload

La libreria espone **due** modi di caricare un video. Entrambi finiscono nella stessa coda di encoding (`encode()` → `POST /external/upload/create`), ma differiscono per trasporto, feedback e gestione degli errori.

## Confronto

| | `upload()` | `upload_s3()` |
|---|---|---|
| Trasporto | Evaporate (multipart S3, resumable) | singolo `PUT` a URL presigned |
| Progress | sì, callback `onProgress(percent, status)` ogni 1s | no |
| File grandi | adatto (multipart, MD5 per part) | il file intero in una richiesta |
| Esito | **callback** `onComplete` / `onError` | **valore di ritorno** `{response, message}` |
| Errore pre-upload | solo `console.log`, non arriva a `onError` | ritorna `{response:"KO", message: e}` |
| Prerequisiti | `get_zone()` (automatica) + signer endpoint | nessuno |
| Dipendenze | `evaporate` + `crypto-js` | solo `fetch` |

**Regola pratica**: video caricati da utenti finali / file grandi → `upload()`. Automazioni, file piccoli, ambienti dove Evaporate non è disponibile → `upload_s3()`.

## `upload()` — Evaporate

```
 upload({file, title, tags, location, category_id, callbacks})
   │
   ├─1─ get_zone()                POST /external/customers/s3
   │      └→ {zone, bucket_upload, access_key, host}
   │
   ├─2─ Evaporate.create({
   │       signerUrl: <base>/external/upload/sign_s3_url,
   │       signHeaders: { tangram_key: api_key },      ← unico uso in header dell'api_key
   │       aws_url: host, aws_key: access_key, bucket: bucket_upload,
   │       computeContentMd5: true,                    ← MD5/SHA256 via crypto-js
   │       progressIntervalMS: 1000, cloudfront: false,
   │       sendCanonicalRequestToSignerUrl: true })
   │
   ├─3─ evaporate.add({ file, name: file.name.trim(),
   │       started  → onStart()
   │       progress → onProgress(percent, status)      ← percent è 0..1
   │       error    → onError(error)
   │       complete → ─┐ })
   │                   │
   └─4─────────────────┴→ encode(fileName, file, title, tags, location, category_id, zone)
                             POST /external/upload/create  →  onComplete(uploadResponse)
```

```js
client.upload({
  file: fileInput.files[0],
  title: "Titolo",
  category_id: categorySelect.value,
  onStart:    () => { /* disabilita la form */ },
  onProgress: (percent) => { bar.style.width = percent * 100 + "%"; },
  onComplete: (res) => { console.log("jobid", res); },
  onError:    (err) => { alert(err); },
});
```

⚠️ Se `get_zone()` o `Evaporate.create()` falliscono, l'eccezione è catturata e **solo loggata** (`console.log("failed to upload", e)`): `onError` non viene chiamata e la UI resta in stato "in corso". Se ti serve un fallimento visibile, incapsula tu la chiamata con un timeout/guardia.

## `upload_s3()` — presigned PUT

```
 upload_s3({file, title, tags, location, category_id})
   │
   ├─1─ POST /external/upload/presignedUrl   {api_key, client_id, filename}
   │      └→ {response:"OK", message:<presigned_url>, region}
   │           └ se response != "OK" → ritorna il JSON così com'è
   │
   ├─2─ PUT <presigned_url>  body: file      (richiesta diretta a S3/MinIO)
   │      └ se !ok → {response:"KO", message:"failed to upload to s3"}
   │
   └─3─ encode(file.name, file, title, tags, location, category_id, region)
          POST /external/upload/create  →  ritornato al chiamante
```

```js
const res = await client.upload_s3({
  file: fileInput.files[0],
  title: "Titolo",
  category_id: categorySelect.value,
});
if (res.response === "KO") { alert(res.message); return; }
```

⚠️ Il `catch` finale ritorna `{response:"KO", message: e}` dove `e` è l'**oggetto `Error`**, non una stringa: un `alert(res.message)` mostra `[object Error]` o simile. Serializzalo tu (`String(e)` / `e.message`).

📌 Il commento nel sorgente dice che `upload_s3` è "solo un upload su S3, i video non appaiono in piattaforma": **non è più vero** — dalla v1.0.x chiama `encode()` come `upload()`, quindi il video entra in piattaforma. Commit di riferimento: `unified upload_s3`.

## Dopo l'upload

```js
const progress = await client.get_jobid_progress(jobid);   // avanzamento encoding
const dettaglio = await client.get_single_upload(jobid);    // dettaglio job
await client.add_video_thumb(fileThumb, jobid);             // thumbnail custom
await client.set_published_upload(jobid, true);             // pubblicazione
```

## Provare in locale

```bash
npm i
npm run build            # bundle contro l'endpoint PROD
#   oppure: npm run dev  # watch, bundle contro l'endpoint DEV
open index.html          # serve dist/compress.umd.js
```

`index.html` chiede API key + customer name, carica le categorie e offre i due bottoni **Upload Evaporate** (`upload()`) e **Upload Presign** (`upload_s3()`). La logica è tutta in [`example.js`](../example.js). È l'unico "test" del repo: se cambi una firma pubblica, aggiorna anche l'esempio.

⚠️ Aprire `index.html` con `file://` può far fallire le richieste per CORS: se succede, servi la cartella (`npx serve .` o `python3 -m http.server`).
