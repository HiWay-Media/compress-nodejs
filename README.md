# Compress nodejs

![GitHub](https://img.shields.io/github/license/HiWay-Media/compress-nodejs)
![GitHub last commit](https://img.shields.io/github/last-commit/HiWay-Media/compress-nodejs)
[![Node.js CI](https://github.com/HiWay-Media/compress-nodejs/actions/workflows/npm.yml/badge.svg)](https://github.com/HiWay-Media/compress-nodejs/actions/workflows/npm.yml)

The Compress NodeJS library provides access to the Compress API for encoding videos, restreamers.

> ⚠️ **Despite the name, this is a browser library.** It relies on `fetch`, `FormData`, `File` and [Evaporate](https://github.com/TTLabs/EvaporateJS) (browser-side S3 multipart upload), and it is consumed as the UMD global `TangramClient`. There is no Node runtime, no CLI.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API overview](#api-overview)
- [Documentation](#documentation)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install compress-nodejs
# or
yarn add compress-nodejs
```

Or straight in a page, via the UMD bundle:

```html
<script type="text/javascript" src="./dist/compress.umd.js"></script>
```

> ℹ️ Runtime dependencies (`evaporate`, `crypto-js`) are currently declared as devDependencies — the UMD bundle inlines them, but a CJS/ESM consumer must install them too. See [docs/known-issues.md](docs/known-issues.md).

## Usage

```javascript
var apiKey = apiKeyInput.value;
var customerName = customerNameInput.value;

if (!apiKey) {
  alert("Please enter an API Key");
  return;
}

if (!customerName) {
  alert("Please enter a Customer Name");
  return;
}

window.tangram = new TangramClient(apiKey, customerName);

// list the customer categories
const categories = await tangram.get_categories();

// upload a video with progress (Evaporate multipart) — the video is encoded by the platform
tangram.upload({
  file: fileInput.files[0],
  title: "My title",
  category_id: categories[0].id,
  onStart:    () => console.log("started"),
  onProgress: (percent) => console.log(percent * 100 + "%"),
  onComplete: (res) => console.log("done", res),
  onError:    (err) => console.error(err),
});

// …or upload through a presigned URL (no progress, returns a result)
const res = await tangram.upload_s3({
  file: fileInput.files[0],
  title: "My title",
  category_id: categories[0].id,
});
if (res.response === "KO") console.error(res.message);
```

A full working example lives in [`example.js`](example.js) + [`index.html`](index.html).
Every method authenticates by sending `api_key` in the JSON body, and **throws** on a non-2xx response.

## API overview

| Area | Methods |
|---|---|
| Account / storage | `get_credential`, `get_zone`, `get_s3_space` |
| Categories | `get_categories`, `create_category` |
| Upload / VOD | `upload`, `upload_s3`, `encode`, `add_video_thumb`, `get_uploads`, `get_single_upload`, `get_jobid_progress`, `set_published_upload`, `get_sign_s3_url` |
| Restreamers | `get_restreamers`, `get_restreamers_ott_all`, `get_restreamer`, `get_running_instances`, `scale_restreamer` |
| Streaming | `restreamer_hls_start/stop`, `restreamer_push_start/stop`, `restreamer_pull_start/stop` |
| Events | `createEvent`, `bulk_events_create`, `get_events_history`, `live_to_vod` |
| Helpers | `isValidProtocol` (`rtmp`/`srt` only), `createExternalServer` |

Full signatures, request bodies and endpoints: **[docs/api-reference.md](docs/api-reference.md)**.

## Documentation

| Doc | Content |
|---|---|
| [docs/README.md](docs/README.md) | Documentation hub, repo map, glossary |
| [docs/architecture.md](docs/architecture.md) | How the client is built, call pattern, instance state, bundle outputs |
| [docs/api-reference.md](docs/api-reference.md) | Every method: parameters, endpoint, payload, return value |
| [docs/upload-flows.md](docs/upload-flows.md) | `upload()` vs `upload_s3()`, diagrams, running the demo locally |
| [docs/build-release.md](docs/build-release.md) | Build defines, versioning, CI workflows, release procedure |
| [docs/known-issues.md](docs/known-issues.md) | Known bugs and traps, with suggested priority |
| [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md) | Working rules for AI agents in this repo |

## Development

```bash
npm i
npm run build     # bundle against the PROD API (api-compress.hiway.media)
npm run dev       # watch build against the DEV API (api-compress.hiwaymedia.dev)
open index.html   # demo page, loads dist/compress.umd.js
```

The API endpoint is **injected at build time** (`microbundle --define API_ENDPOINT=…`), not read from the environment: always rebuild with `npm run build` before publishing. Publishing to npm happens only when a **GitHub Release is published** ([`.github/workflows/npm-package.yml`](.github/workflows/npm-package.yml)).

There is no test suite; verification is manual through the demo page.

## Contributing

We welcome contributions from the open-source community. Work on `dev`, open PRs against `main`, keep `README.md`, `example.js` and `docs/` in sync when a public signature changes.

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute it as per the terms of the license.

For any questions or issues, please create an issue on GitHub.
