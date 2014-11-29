linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
{XRegExp} = require 'xregexp'

class LinterLiferay extends Linter

    # Syntaxes supported by check_sf
    @syntax: ['text.html', 'text.html.jsp', 'source.js', 'source.css', 'source.css.scss']

    defaultLevel: 'warning'

    isNodeExecutable: yes

    linterName: 'Liferay'

    # Regex to extract linting information from check_sf
    regex: 'Lines?:?\\s+(?<lineA>\\d+)(?<lineB>\\-\\d+)?\\s+(?<message>.*)'

    regexFlags: 'i'

    constructor: (editor) ->
        super(editor)
        @cmd = [atom.config.get('linter-liferay.checkSFPath'), '--no-lint', '--no-color']

    processMessage: (message, callback) ->
        messages = []
        regex = XRegExp @regex, @regexFlags

        XRegExp.forEach message, regex, (match, i) =>
            {lineA, lineB, message} = match

            match.line = lineA

            if lineB?
                match.lineStart = lineA
                match.lineEnd = lineB.substr 1

            msg = {
                col: match.col
                level: @defaultLevel
                line: match.line
                linter: @linterName
                message: @formatMessage match
                range: @computeRange match
            }

            messages.push msg if msg.range?
        , this

        callback messages

module.exports = LinterLiferay
