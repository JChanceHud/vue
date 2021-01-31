import { validate, isJS, onEmit } from './util'

export default class VueSSRServerPlugin {
  constructor (options = {}) {
    this.options = options
  }

  apply (compiler) {
    validate(compiler)

    onEmit(compiler, 'vue-server-plugin', (compilation, cb) => {
      const stats = compilation.getStats().toJson()
      const entryName = Object.keys(stats.entrypoints)[0]
      const entryInfo = stats.entrypoints[entryName]

      if (!entryInfo) {
        // #5553
        return cb()
      }

      const entryAssets = entryInfo.assets.filter(isJS)

      if (entryAssets.length > 1) {
        throw new Error(
          `Server-side bundle should have one single entry file. ` +
          `Avoid using CommonsChunkPlugin in the server config.`
        )
      }

      const entry = entryAssets[0]
      if (!entry || typeof entry !== 'string') {
        throw new Error(
          `Entry "${entryName}" not found. Did you specify the correct entry option?`
        )
      }

      cb()
    })
  }
}
