# Problemi noti e trappole

Elenco ricavato leggendo il sorgente (stato al 14/09/2026, `package.json` 1.0.3). Nessuno di questi è stato corretto: sono cambi di comportamento che vanno decisi e testati, non infilati in un commit di documentazione.

## 🐞 Bug

### Dipendenze invertite in `package.json`

```json
"devDependencies": { "crypto-js", "evaporate", "jssha", "tslib" },
"dependencies":    { "microbundle" }
```

`microbundle` è un **build tool** e sta tra le `dependencies`; `evaporate` e `crypto-js` sono **importati dal sorgente** e stanno tra le `devDependencies`. Chi installa `compress-nodejs` da npm si porta dietro microbundle e **non** riceve evaporate/crypto-js: gli entrypoint CJS/ESM si rompono a meno che il consumer non li abbia già in albero. Il build UMD li inlina, quindi il caso `<script>` funziona — ed è per questo che il problema non si è mai visto.

*Fix*: spostare `evaporate`/`crypto-js`/`tslib` in `dependencies` (o `peerDependencies`), `microbundle` in `devDependencies`. **Verificare con `npm pack` + install in un progetto pulito** prima di rilasciare: è un cambio di packaging e tocca anche come microbundle tratta gli externals. `jssha` non risulta importato da `lib/` — candidato alla rimozione, da confermare.

### Endpoint sbagliati

| Metodo | Path usato | Path atteso (costante definita e mai usata) |
|---|---|---|
| `live_to_vod()` | `/external/events/history` (`EVENTS_HISTORY`) | `/external/events/generate_vod` (`LIVE_TO_VOD`) |
| `create_category()` | `/external/upload/categories` (`GET_CATEGORIES`) | `/external/upload/categories/create` (`CREATE_CATEGORY`) |

In entrambi i casi la costante giusta esiste in `constants.ts` ma non è referenziata: sembra un copia-incolla non finito. `live_to_vod()` oggi manda i suoi parametri all'endpoint di storico — il VOD non viene generato. Prima di correggere, **verificare col backend** che i path e i body attesi siano quelli.

### Race nel costruttore

```js
constructor(apikey, customer_name) {
  ...
  this.get_credential().then((res) => {     // ← nessun await, nessuna promise esposta
    this.credentials = res;
    this.customerId = res.customer_id;
  });
}
```

Subito dopo `new TangramClient(...)`, `credentials` e `customerId` sono `undefined`. `createEvent()` legge `this.customerId` → produce `{..., customer_id: undefined}`, che finisce in `bulk_events_create()`. Non esiste una API di "ready".

*Workaround per i consumer*: attendere una qualsiasi chiamata async (es. `await client.get_categories()`) prima di costruire eventi.
*Fix pulito*: esporre una `ready` promise (o una factory `static async create()`) e attenderla in `createEvent`. È un cambio di API → bump major.

## ⚠️ Trappole

### `API_ENDPOINT` è compilato nel bundle
`npm run dev` produce un `dist/` cablato sull'ambiente **dev**. Pubblicarlo punterebbe l'SDK di tutti i clienti sull'endpoint sbagliato. Prima di ogni release: `npm run build`. Vedi [build-release.md](build-release.md).

### Messaggi d'errore copiati/incollati
Molti `throw` dicono `"something went wrong during get categories"` o `"… during get uploads"` anche dentro metodi che non c'entrano (`add_video_thumb`, `set_published_upload`, `get_events_history`, `live_to_vod`, tutti i `restreamer_*` dicono `restreamer_push_start`). **Non usare il testo dell'errore per localizzare il fallimento.** Correggerli quando si tocca il metodo.

### Il body d'errore dell'API viene perso
L'eccezione porta solo `res.status` e `res.statusText`: il payload JSON con la ragione vera dell'errore non viene letto. Chi debugga deve guardare il tab Network.

### Due contratti di errore diversi per l'upload
`upload()` notifica via callback e non ritorna nulla; `upload_s3()` ritorna `{response, message}` e non lancia; tutto il resto lancia eccezioni. Uniformarli è desiderabile ma è un **breaking change** → bump major.
Inoltre `upload()` cattura le eccezioni pre-Evaporate con un `console.log` e **non** chiama `onError`: la UI resta appesa in stato "in corso".

### `PERMITTED_FILE_EXTENSIONS` non è applicata
È esportata ma nessun metodo la usa: la validazione dell'estensione è a carico del chiamante (o del backend).

### `reporter_email` hardcoded
`encode()` manda `reporter_email: \`${customer_name}@tngrm.io\`` — indirizzo sintetico sul vecchio dominio del brand Tangram. Non è configurabile.

### `encode()` non manda `client_id`
A differenza di tutti gli altri metodi, il body di `/external/upload/create` contiene solo `api_key`. Intenzionale o no, non cambiarlo senza verificare col backend.

### Hook husky senza config commitlint
`.husky/commit-msg` esegue `npx commitlint --edit $1`, ma non esistono né una `commitlint.config.js` né `@commitlint/*` tra le dipendenze. Il commit può fallire ("Please add rules") o far scaricare a `npx` un pacchetto dalla rete. *Fix*: aggiungere config + dipendenze, oppure rimuovere l'hook. Nel frattempo: `git commit --no-verify`.

### `restreamer_pull_start/stop` di dubbia esistenza
Marcati nel sorgente `TODO: need to understand if is used or no`. Non darli per supportati lato API senza conferma.

### Nessun test
Il repo non ha suite di test né `npm test` (la riga è commentata nella CI). L'unica verifica è manuale via `index.html`. Qualsiasi refactor di `lib/tangram.ts` è coperto solo dagli occhi del revisore.

### Versione disallineata
`package.json` = 1.0.3, header di `lib/tangram.ts` = v1.0.2. Riallineare.

### PR dependabot aperte
`nanoid`, `rollup`, `xml2js`+`aws-sdk`: transitive di microbundle/evaporate. Da mergiare solo con una build di verifica, non alla cieca.

## Priorità suggerita

| # | Intervento | Impatto | Rischio |
|---|---|---|---|
| 1 | Dipendenze in `package.json` | alto (pacchetto npm rotto per i consumer CJS/ESM) | medio — serve `npm pack` + test |
| 2 | `live_to_vod()` → `LIVE_TO_VOD` | alto (feature non funzionante) | basso, ma va confermato col backend |
| 3 | `create_category()` → `CREATE_CATEGORY` | medio | basso, idem |
| 4 | Race nel costruttore | medio (eventi con `customer_id` undefined) | breaking → major |
| 5 | Messaggi d'errore + body d'errore API | basso (DX/debug) | nullo |
| 6 | Config commitlint o rimozione hook | basso (attrito locale) | nullo |
