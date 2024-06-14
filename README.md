# Compress nodejs

![GitHub](https://img.shields.io/github/license/HiWay-Media/compress-nodejs)
![GitHub last commit](https://img.shields.io/github/last-commit/HiWay-Media/compress-nodejs)
[![Node.js CI](https://github.com/HiWay-Media/compress-nodejs/actions/workflows/npm.yml/badge.svg)](https://github.com/HiWay-Media/compress-nodejs/actions/workflows/npm.yml)

The Compress NodeJS library provides access to the Compress API for encoding videos, restreamers


## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

You can install Compress Node.js using npm or yarn:

```bash
npm install compress-nodejs
# or
yarn add compress-nodejs
```

## Usage

Here's a basic example of how to use Compress Node.js:

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

```
Check also `example.js` and `index.html`


## Contributing
We welcome contributions from the open-source community. To contribute to this project, please follow our Contribution Guidelines.

## License
This project is licensed under the MIT License. You are free to use, modify, and distribute it as per the terms of the license.

For any questions or issues, please create an issue on GitHub.