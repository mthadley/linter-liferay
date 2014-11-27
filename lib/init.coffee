path = require 'path'

module.exports =
    configDefaults:
        checkSFPath: path.join __dirname, '..', 'node_modules', 'check-source-formatting', 'index.js'

    activate: ->
        console.log 'activate linter-liferay'
