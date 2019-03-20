# esi-processor
A processor for processing ESI tags in html documents

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

### IgnoreEsiChooseTags
Ignore the esi:choose tags, only returning a comment

### XmlMode
Use xmlMode (defaults to `true`). This option is passed to `htmlparser2`.

### Verbose
Print extended log to the console.
