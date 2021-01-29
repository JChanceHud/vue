/* @flow */

import { createPromiseCallback } from '../util'
import type { Renderer, RenderOptions } from '../create-renderer'
const PassThrough = require('stream').PassThrough

export function createSharedBundleRendererCreator (
  createRenderer: (options?: RenderOptions) => Renderer
) {
  return function createBundleRenderer (
    bundleRender: Function,
    rendererOptions?: RenderOptions = {}
  ) {

    const renderer = createRenderer(rendererOptions)

    const run = (userContext = {}) => {
      userContext._registeredComponents = new Set();
      global['__VUE_SSR_CONTEXT__'] = {};
      return bundleRender(userContext)
    }

    return {
      renderToString: (context?: Object, cb: any) => {
        if (typeof context === 'function') {
          cb = context
          context = {}
        }

        let promise
        if (!cb) {
          ({ promise, cb } = createPromiseCallback())
        }
        const p = run(context)
        p.catch(err => {
          // rewriteErrorTrace(err, maps)
          cb(err)
        }).then(app => {
          if (app) {
            renderer.renderToString(app, context, (err, res) => {
              // rewriteErrorTrace(err, maps)
              cb(err, res)
            })
          } else {
            cb(new Error('No app returned'))
          }
        })

        return promise
      },

      renderToStream: (context?: Object) => {
        const res = new PassThrough()
        run(context).catch(err => {
          // rewriteErrorTrace(err, maps)
          // avoid emitting synchronously before user can
          // attach error listener
          process.nextTick(() => {
            res.emit('error', err)
          })
        }).then(app => {
          if (app) {
            const renderStream = renderer.renderToStream(app, context)

            renderStream.on('error', err => {
              // rewriteErrorTrace(err, maps)
              res.emit('error', err)
            })

            // relay HTMLStream special events
            if (rendererOptions && rendererOptions.template) {
              renderStream.on('beforeStart', () => {
                res.emit('beforeStart')
              })
              renderStream.on('beforeEnd', () => {
                res.emit('beforeEnd')
              })
            }

            renderStream.pipe(res)
          }
        })

        return res
      }
    }
  }
}
