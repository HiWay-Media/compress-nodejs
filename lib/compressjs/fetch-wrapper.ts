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
 
export const fetchWrapper = {
    ajax
};

async function ajax(method, url, headers, params, options) {
    const base_header = new Headers(headers);

    if (!headers["Content-Type"]) {
        base_header.append("Content-Type", "application/json");
    }

    let requestOptions = <any>{
        method: method,
        headers: base_header,
    }

    if (params) {
        if (method == 'GET') {
            url += '?' + new URLSearchParams(params)
        } else {
            if (headers["Content-Type"] && headers["Content-Type"] == "application/x-www-form-urlencoded") {
                requestOptions.body = new URLSearchParams(params)
            } else {
                requestOptions.body = JSON.stringify(params)
            }
        }
    }

    if (options) {
        requestOptions = { ...requestOptions, ...options }
        if (options.headers) {
            requestOptions.headers = { ...requestOptions.headers, ...headers }
        }
    }

    try {
        const response = await fetch(url, requestOptions)
        return response
    } catch (err) {
        let r = new Response(JSON.stringify({error: err.message}), { status: 500, headers: new Headers({"Content-Type": "application/json"}) })
        return r
    }
}
