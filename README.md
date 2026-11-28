# esi-processor
![node](https://img.shields.io/node/v/esi-processor.svg?style=popout-square) ![npm](https://img.shields.io/npm/v/esi-processor.svg?style=popout-square)

A processor for processing ESI tags in html documents. Currently supporting `esi:include`, `esi:remove`, `esi:comment`, `<!--esi -->`, `esi:choose`, `esi:try` and `esi:vars`.

## Installation
```node
npm install esi-processor
```

## Usage

```node
const esi = require('esi-processor').ESI;

const processed = await esi(html, [options]);
```

## Options
You can use the following options:

### BaseUrl
Add a base url to be used on relative esi:includes

### Headers
Add custom HTTP headers for remote esi:includes e.g. ```{ 'X-Custom-Header': 'x-custom-value' }```

### IgnoreEsiChooseTags
Ignore the esi:choose tags, only returning a comment

### XmlMode
Use xmlMode (defaults to `true`). This option is passed to `htmlparser2`.

### Verbose
Print extended log to the console.

### ParallelProcessing
Process sibling nodes in parallel (useful when multiple `esi:include` tags fetch remote content). Defaults to `false`.

### ParallelProcessingMaxConcurrency
Optional max concurrency for `ParallelProcessing`. Defaults to unlimited sibling concurrency when `ParallelProcessing` is enabled.

## Notes

- `esi:vars` resolves variables recursively in descendant text nodes and attributes inside the `esi:vars` block.
- Outside `esi:vars`, variables are only resolved in the attributes of ESI tags (e.g. `esi:include src`).
- ESI tags nested inside `esi:vars` are processed after variable substitution.
- Supported variables are `HTTP_ACCEPT_LANGUAGE`, `HTTP_COOKIE`, `HTTP_HOST`, `HTTP_REFERER`, `HTTP_USER_AGENT` and `QUERY_STRING`. Any other `$(...)` text, such as jQuery's `$(document)`, is left untouched.
