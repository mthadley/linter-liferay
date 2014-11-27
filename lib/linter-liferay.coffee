linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"

class LinterLiferay extends Linter

    # Syntaxes supported by check_sf
    @syntax: ['text.html', 'text.html.jsp', 'source.js', 'source.css', 'source.css.scss']

    defaultLevel: 'warning'

    isNodeExecutable: yes

    linterName: 'Liferay'

    # Regex to extract linting information from check_sf
    regex: 'Line:?\\s+(?<line>\\d+)\\s+(?<message>.*)'

    regexFlags: 'i'

    constructor: (editor) ->
        super(editor)
        @cmd = [atom.config.get('linter-liferay.checkSFPath'), '--no-lint', '--no-color']

module.exports = LinterLiferay
