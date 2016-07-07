'use babel'

import {BufferedProcess, CompositeDisposable} from 'atom'
import path from 'path'

/**
 * Returns the value if defined, or a default value if not
 * @param {a} val - The value to check if undef
 * @param {b} default - the default value
 * @return {a|b}
 */
function withDefault(val, defaultVal) {
  return typeof val === 'undefined' ? defaultVal : val
}

/**
 * Supported grammerScopes for linter-liferay
 * @type {Array.<string>}
 */
const grammarScopes = [
  'source.css.scss',
  'source.css',
  'source.js.jsx',
  'source.js',
  'source.velocity',
  'text.html.jsp',
  'text.html.mustache',
  'text.html'
]

/**
 * Regex used to parse check_sf's output. Each capture
 * group corresponds to the following value:
 *
 * $1 lineStart
 * $2 lineEnd
 * $3 column
 * $4 message
 *
 * @type {RegExp}
 */
const regex = /Lines?\s+(\d+)(\-\d+)?(?:,\s+Column\s+)?(\d+)?:\s+(.*)/i

/**
 * Class for managing the linting files and responding to
 * config changes
 */
export default class LinterLiferay {
  /**
   * Create a LinterLiferay
   */
  constructor() {
    this._subscriptions = new CompositeDisposable()

    this._subscriptions.add(atom.config.observe(
      'linter-liferay.lintJS',
      () => this._args = this._formatArgs()
    ))

    this._subscriptions.add(atom.config.observe(
      'linter-liferay.checkSFPath',
      newVal => this._cmd = newVal
    ))
  }

  /**
   * Creates a process to read the ouput of check_sf
   * @param {string} path - Path to the file
   * @param {function} cb - The function to call with the output
   * @return {BufferedProcess}
   */
  _createProcess(filePath, cb) {
    const output = []

    return new BufferedProcess({
      command: this._cmd,
      args: [...this._args, filePath],
      options: {
        cwd: path.dirname(filePath)
      },
      stdout: data => output.push(data),
      exit: code => {
        const result = code === 0 ? output : [];

        cb(result)
      }
    })
  }

  /**
   * Formats and returns the arguments for check_sf
   * @return {Array.<string>}
   */
  _formatArgs() {
    const args = ['--no-color', '--show-columns']

    if (!atom.config.get('linter-liferay.lintJS')) {
      args.push('--no-lint')
    }

    return args
  }

  /**
   * Performs the actual lint operation
   * @param {TextEditor} editor - The editor being linted
   * @return {Promise}
   **/
  _lint(editor) {
    return new Promise((resolve, reject) => {
      const filePath = editor.getPath()

      const process = this._createProcess(
        filePath,
        output => resolve(this._getMessages(editor, output))
      )

      process.onWillThrowError(({error, handle}) => {
        atom.notifications.addError(
          `Cannot execute ${this._cmd}`,
          {
            detail: error.message,
            dismissable: true
          }
        )

        handle()
        reject(error)
      })
    })
  }

  /**
   * Converts a RegExp exec result to a linter-liferay
   * match object
   * @param {Array} result
   * @return {Object}
   */
  _getMatch(result) {
    return {
      column: result[3],
      lineEnd: result[2],
      lineStart: result[1],
      message: result[4]
    }
  }

  /**
   * Parses check_sf's output into linter messages
   * @param {TextEditor} editor - The editor being linted
   * @param {Array.<string>} output - The output from check_sf
   * @return {Array.<Object>}
   */
  _getMessages(editor, output) {
    return output.reduce(
      (messages, next) => {
        const result = regex.exec(next)

        if (result) {
          const match = this._getMatch(result)

          messages.push({
            filePath: editor.getPath(),
            range: this._getRange(editor, match),
            type: 'warning',
            text: match.message
          })
        }

        return messages
      },
      []
    )
  }

  /**
   * Computes the range for a given match
   * @param {TextEditor} editor - The editor being linted
   * @param {Object} match - The match object
   * @return {Array.<Array.<number>>}
   */
  _getRange(editor, match) {
    const rowStart = match.lineStart
    const rowEnd = withDefault(match.lineEnd, rowStart)

    const colStart = withDefault(match.column, 1)

    let colEnd = 1
    const lineText = editor.lineTextForBufferRow(rowEnd - 1)
    if (lineText) {
      colEnd = lineText.length
    }

    // Ranges are 0-based
    return [
      [rowStart - 1, colStart - 1],
      [rowEnd - 1, colEnd - 1]
    ]
  }

  /**
   * Returns a provider for the linter plugin
   * @return {Object}
   */
  provideLinter() {
    return {
      grammarScopes,
      scope: 'file',
      lintOnFly: true,
      lint: editor => this._lint(editor),
      name: 'liferay'
    }
  }

  /**
   * Destroys the linter-liferay instance, cleaning up any
   * subscriptions.
   */
  destroy() {
    this._subscriptions.dispose()
  }
}
