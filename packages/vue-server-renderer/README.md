# vue-server-renderer

> This package is auto-generated. For pull requests please see [src/platforms/web/entry-server-renderer.js](https://github.com/vuejs/vue/blob/dev/src/platforms/web/entry-server-renderer.js).

This package offers Node.js server-side rendering for Vue 2.0.

This is a fork of the VueJS maintained server renderer. This package works by executing the rendering logic in the same process instead of using `eval` to execute in an isolate. This makes it compatible with services such as [cloudflare workers](https://workers.cloudflare.com/).

- [API Reference](https://ssr.vuejs.org/en/api.html)
- [Vue.js Server-Side Rendering Guide](https://ssr.vuejs.org)

## Usage

Configure webpack the same as the normal SSR renderer. Use the `VueSSRClientPlugin` in your client webpack build and `VueSSRServerPlugin` for your server entrypoint.

The webworker implementation should use the "shared bundle renderer". This is unique to this fork of the server renderer. Instead of accepting a bundle it will accept a function.

Once the shared renderer is created it functions the same as a regular bundle renderer. See the documentation above for more info.

Example use:

```js
const createApp = require('./entry-server').default
const { createSharedBundleRenderer } = require('vue-webworker-renderer')
const clientManifest = require('../build/vue-ssr-client-manifest.json')
const serverBundle = require('../build/server-bundle.js').default

const renderer = createSharedBundleRenderer(serverBundle, {
  clientManifest,
  template: (content, context) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${context.head || ''}
    ${context.renderResourceHints(context)}
    ${context.renderStyles(context)}
  </head>
  <body>
    ${content}
    ${context.renderState(context)}
    ${context.renderScripts(context)}
  </body>
</html>
`,
})

async function render(req) {
  const url = new URL(req.url)
  const context = {
    title: 'Hello World',
    url: url.pathname,
  }
  return renderer.renderToString(context)
}
```

### Caveats

The template _must_ be a function. The string templating in the default renderer uses lodash templates which in turn uses `eval`.
