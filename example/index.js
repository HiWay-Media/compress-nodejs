/*
 *
 * Author: Allan Nava (allan.nava@hiway.media)
 * -----
 * Last Modified: 
 * Modified By: Allan Nava (allan.nava@hiway.media>)
 * -----
 * Copyright 2023 - 2023 © 
 * 
 */
//import { TangramClient } from "compress-nodejs";
const compress  = require('compress-nodejs');
//
let tngrm = new compress.TangramClient(
    "api_key",
    "customer"
);
//
console.log(`tngrmClient ${tngrm}`);
