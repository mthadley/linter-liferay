path = require 'path'

module.exports =
	config:
		lintJS:
			default: no
			description: 'Check javascript source for errors in addition to formatting'
			title: 'Lint Javascript'
			type: 'boolean'
		checkSFPath:
			default: path.join __dirname, '..', 'node_modules', 'check-source-formatting', 'bin', 'index.js'
			description: 'The absolute path to check-source-formatting\'s main. You generally should have no need to modify this.'
			title: 'Path to check-source-formatting'
			type: 'string'

	activate: ->
		console.log 'activate linter-liferay'

	provideLinter: ->
		{}