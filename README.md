# esi-processor
![node](https://img.shields.io/node/v/esi-processor.svg?style=popout-square) ![npm](https://img.shields.io/npm/v/esi-processor.svg?style=popout-square)

A processor for processing ESI tags in html documents. Currently supporting `esi:include`, `esi:remove`, `esi:comment`, `<!--esi -->`, `esi:choose` and `esi:vars`.

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
