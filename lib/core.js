'use strict';

const FS = require('node:fs');
const PATH = require('node:path');
const LINE = require('n-readlines');

/**
 * Collect an error object into the errors array.
 * Returns false (mirrors original setLog behavior for control flow).
 */
function addError(errors, message, path, line, details) {
  errors.push({
    message,
    path: path || null,
    line: line || null,
    details: details || null,
  });
  return false;
}

/**
 * Create detailed data structures.
 * Pure function - no side effects.
 */
function getData(variable, report, path, line) {
  let name = variable[2].replace(/(\[|\])/g, '');

  switch (name.toLowerCase()) {
    case 'int':
    case 'data':
    case 'float':
    case 'double':
    case 'string':
    case 'boolean':
      break;
    default:
      if (report[name]) {
        report[name].COUNT += 1;
      } else {
        report[name] = {
          PATH: path,
          LINE: line,
          COUNT: 1,
        };
      }
      break;
  }

  return {
    NAME: variable[1],
    MARK: variable[3].trim(),
    CLASS: name,
    ARRAY: RegExp(/\[(.*?)\]/g).test(variable[2]),
    OPTION: {},
  };
}

/**
 * Parse .code file content from a file path.
 * @param {string} filePath - Absolute path to the .code file.
 * @param {object} data - Accumulator object for parsed data.
 * @param {object} report - Report object for tracking declarations.
 * @param {Array} errors - Array to collect errors into.
 * @returns {boolean} true on success, false on error.
 */
function getCode(filePath, data, report, errors) {
  var d = 0;
  var l = 0;
  var n = null;

  if (FS.existsSync(filePath) === false) {
    return addError(errors, 'Code file not found.', filePath, null, null);
  }

  var liner = new LINE(filePath);

  for (var line = liner.next(); line; line = liner.next()) {
    l++;
    line = line.toString().trim();
    if (line.length < 1) continue;

    if (RegExp(/^}$/g).test(line)) {
      d = d - 1;
      switch (d) {
        case 1:
          if (n.NAME) data.CODE.push(n);
          break;
      }
      continue;
    }

    var block = line.match(/(.*?)\s{1}\{$/i);

    if (Array.isArray(block)) {
      d = d + 1;
      switch (d) {
        case 1:
          if (block[1] !== 'CODE')
            return addError(
              errors,
              'The starting point for writing a syntax is to write an "CODE" that must be written.',
              filePath,
              l,
              block[0],
            );
          if (data[block[1]]) break;
          data[block[1]] = [];
          break;
        case 2: {
          block = block.input.match(/(.*?)\s{1}(.*?)\{$/i);
          if (!Array.isArray(block))
            return addError(
              errors,
              'Code names must have the structure "([0-9a-zA-Z_]) (.*?) {}".',
              filePath,
              l,
              null,
            );
          if (RegExp(/^[0-9a-zA-Z_]+$/g).test(block[1]) === false)
            return addError(
              errors,
              'Code names must have the structure "([0-9a-zA-Z_]) (.*?) {}".',
              filePath,
              l,
              block.input.replace(
                /(.*?)\s{1}(.*?)\{$/i,
                (_, m1, m2) =>
                  `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2}{`,
              ),
            );
          if (data.CODE.some((row) => row.NAME === block[1]))
            return addError(
              errors,
              'Code with the same class exists.',
              filePath,
              l,
              block[0],
            );
          n = {
            NAME: block[1],
            MARK: block[2],
            CODE: [],
          };
          report[block[1]] = {
            PATH: filePath,
            LINE: l,
            COUNT: 0,
          };
          break;
        }
        case 3: {
          block = block.input.match(/(.*?)\s{1}(.*?)\s{1}\{$/i);
          if (
            !Array.isArray(block) ||
            new RegExp(/^\s*([0-9]+)\s{1}(.*?)$/g).test(block.input) === false
          )
            return addError(
              errors,
              'Code must have the structure "([0-9]+) (.*?) {}',
              filePath,
              l,
              null,
            );
          if (
            n.CODE.some(
              (row) => row.CODE === block[1] || row.NAME === block[2],
            ) ||
            data.CODE.some((row) =>
              row.CODE.some((c) => c.CODE === block[1]),
            )
          )
            return addError(
              errors,
              'Code with the same "name" or "code" exists.',
              filePath,
              l,
              block[0],
            );
          n.CODE.push({
            CODE: block[1],
            NAME: block[2],
            MARK: {},
          });
          report[n.NAME].COUNT += 1;
          break;
        }
      }
      continue;
    }

    var variable = line.match(/(.*?)\s{1}(.*?)$/i);
    if (Array.isArray(variable)) {
      switch (d) {
        case 3: {
          if (
            new RegExp(/^\s*([0-9a-zA-Z_]+)\s{1}(.*?)$/g).test(
              variable.input,
            ) === false
          )
            return addError(
              errors,
              'Code data must have the structure "([0-9a-zA-Z_) (.*?)".',
              filePath,
              l,
              null,
            );
          var cur = n.CODE.pop();
          cur.MARK[variable[1]] = variable[2].trim();
          n.CODE.push(cur);
          break;
        }
      }
    }
  }

  return true;
}

/**
 * Parse .code content from a string.
 * @param {string} content - The .code file content as a string.
 * @param {object} [data] - Optional accumulator (created if not provided).
 * @param {object} [report] - Optional report (created if not provided).
 * @param {Array} [errors] - Optional errors array.
 * @returns {boolean} true on success, false on error.
 */
function getCodeFromString(content, data, report, errors) {
  var d = 0;
  var l = 0;
  var n = null;

  data = data || {};
  report = report || {};
  errors = errors || [];

  var lines = content.split(/\r?\n/);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    l++;
    if (line.length < 1) continue;

    if (RegExp(/^}$/g).test(line)) {
      d = d - 1;
      switch (d) {
        case 1:
          if (n.NAME) data.CODE.push(n);
          break;
      }
      continue;
    }

    var block = line.match(/(.*?)\s{1}\{$/i);

    if (Array.isArray(block)) {
      d = d + 1;
      switch (d) {
        case 1:
          if (block[1] !== 'CODE')
            return addError(
              errors,
              'The starting point for writing a syntax is to write an "CODE" that must be written.',
              '<string>',
              l,
              block[0],
            );
          if (data[block[1]]) break;
          data[block[1]] = [];
          break;
        case 2: {
          block = block.input.match(/(.*?)\s{1}(.*?)\{$/i);
          if (!Array.isArray(block))
            return addError(
              errors,
              'Code names must have the structure "([0-9a-zA-Z_]) (.*?) {}".',
              '<string>',
              l,
              null,
            );
          if (RegExp(/^[0-9a-zA-Z_]+$/g).test(block[1]) === false)
            return addError(
              errors,
              'Code names must have the structure "([0-9a-zA-Z_]) (.*?) {}".',
              '<string>',
              l,
              block.input.replace(
                /(.*?)\s{1}(.*?)\{$/i,
                (_, m1, m2) =>
                  `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2}{`,
              ),
            );
          if (data.CODE.some((row) => row.NAME === block[1]))
            return addError(
              errors,
              'Code with the same class exists.',
              '<string>',
              l,
              block[0],
            );
          n = {
            NAME: block[1],
            MARK: block[2],
            CODE: [],
          };
          report[block[1]] = {
            PATH: '<string>',
            LINE: l,
            COUNT: 0,
          };
          break;
        }
        case 3: {
          block = block.input.match(/(.*?)\s{1}(.*?)\s{1}\{$/i);
          if (
            !Array.isArray(block) ||
            new RegExp(/^\s*([0-9]+)\s{1}(.*?)$/g).test(block.input) === false
          )
            return addError(
              errors,
              'Code must have the structure "([0-9]+) (.*?) {}',
              '<string>',
              l,
              null,
            );
          if (
            n.CODE.some(
              (row) => row.CODE === block[1] || row.NAME === block[2],
            ) ||
            data.CODE.some((row) =>
              row.CODE.some((c) => c.CODE === block[1]),
            )
          )
            return addError(
              errors,
              'Code with the same "name" or "code" exists.',
              '<string>',
              l,
              block[0],
            );
          n.CODE.push({
            CODE: block[1],
            NAME: block[2],
            MARK: {},
          });
          report[n.NAME].COUNT += 1;
          break;
        }
      }
      continue;
    }

    var variable = line.match(/(.*?)\s{1}(.*?)$/i);
    if (Array.isArray(variable)) {
      switch (d) {
        case 3: {
          if (
            new RegExp(/^\s*([0-9a-zA-Z_]+)\s{1}(.*?)$/g).test(
              variable.input,
            ) === false
          )
            return addError(
              errors,
              'Code data must have the structure "([0-9a-zA-Z_) (.*?)".',
              '<string>',
              l,
              null,
            );
          var cur = n.CODE.pop();
          cur.MARK[variable[1]] = variable[2].trim();
          n.CODE.push(cur);
          break;
        }
      }
    }
  }

  return true;
}

/**
 * Parse .struct file content from a file path.
 * @param {string} filePath - Absolute path to the .struct file.
 * @param {object} data - Accumulator object for parsed data.
 * @param {object} report - Report object with { def, ref } for tracking.
 * @param {Array} errors - Array to collect errors into.
 * @returns {boolean} true on success, false on error.
 */
function getStruct(filePath, data, report, errors) {
  var l = 0;
  var d = 0;

  if (FS.existsSync(filePath) === false) {
    return addError(errors, 'Structure file not found.', filePath, null, null);
  }

  var liner = new LINE(filePath);

  for (var line = liner.next(); line; line = liner.next()) {
    l++;

    try {
      line = line.toString().trim();
      if (line.length < 1) continue;

      if (RegExp(/^}$/g).test(line)) {
        d = d - 1;
        continue;
      }

      var block = line.match(/(.*?)\s{1}\{$/i);

      if (Array.isArray(block)) {
        d = d + 1;

        switch (d) {
          case 1:
            if (block[1] !== 'STRUCT')
              return addError(
                errors,
                'The starting point for writing a syntax is to write an "STRUCT" that must be written.',
                filePath,
                l,
                block[0],
              );
            if (data[block[1]]) break;
            data[block[1]] = [];
            break;
          case 2: {
            block = block.input.match(/(.*?)\s{1}(.*?)\{$/i);
            if (!Array.isArray(block))
              return addError(
                errors,
                'Class names must have the structure "([0-9a-zA-Z_]) (.*?) {}"',
                filePath,
                l,
                null,
              );
            if (RegExp(/^[0-9a-zA-Z_]+$/g).test(block[1]) === false)
              return addError(
                errors,
                'Class names must have the structure "([0-9a-zA-Z_]) (.*?) {}"',
                filePath,
                l,
                block.input.replace(
                  /(.*?)\s{1}(.*?)\{$/i,
                  (_, m1, m2) =>
                    `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2}{`,
                ),
              );
            data.STRUCT.push({
              PATH: filePath,
              NAME: block[1],
              MARK: block[2],
              DATA: [],
            });
            report.def[block[1]] = {
              PATH: filePath,
              LINE: l,
            };
            break;
          }
          case 3: {
            block = block.input.match(/(.*?)\s{1}(.*?)\s{1}([^{]+)/i);
            if (!Array.isArray(block)) break;
            var cur = data.STRUCT.pop();
            cur.DATA.push(getData(block, report.ref, filePath, l));
            data.STRUCT.push(cur);
            break;
          }
        }

        continue;
      }

      var variable = /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i.exec(line);
      var cur = data.STRUCT.pop();

      switch (d) {
        case 2: {
          if (!Array.isArray(variable))
            return addError(
              errors,
              'Struct must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".',
              filePath,
              l,
              null,
            );
          if (
            RegExp(
              /^\s*([0-9a-zA-Z_]+)\s{1}([0-9a-zA-Z_[\]]+)\s{1}(.*?)+$/g,
            ).test(variable.input) === false
          )
            return addError(
              errors,
              'Struct data must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".',
              filePath,
              l,
              variable.input.replace(
                /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i,
                (_, m1, m2, m3) =>
                  `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2.replace(/[^0-9a-zA-Z_\s[\]]/g, '')} ${m3}`,
              ),
            );
          cur.DATA.push(getData(variable, report.ref, filePath, l));
          break;
        }
        case 3: {
          if (!Array.isArray(variable))
            return addError(
              errors,
              'Struct data must have the structure "([0-9a-zA-Z\uAC00-\uD7A3-_!=><]+) (.*?)".',
              filePath,
              l,
              null,
            );
          if (
            new RegExp(/^[0-9a-zA-Z\uAC00-\uD7A3-_!=><]+$/g).test(
              variable[1],
            ) === false
          )
            return addError(
              errors,
              'Struct data must have the structure "([0-9a-zA-Z\uAC00-\uD7A3-_!=><]+) (.*?)".',
              filePath,
              l,
              variable.input.replace(
                /([^\s]+)\s{1}(.*?)$/i,
                (_, m1, m2) =>
                  `${m1.replace(/[^0-9a-zA-Z\uAC00-\uD7A3-_\s!=><]/g, '')} ${m2}`,
              ),
            );
          let pop = cur.DATA.pop();
          pop.OPTION[variable[1]] = [variable[2], variable[3]].join(' ');
          cur.DATA.push(pop);
          break;
        }
      }

      data.STRUCT.push(cur);
    } catch {
      return addError(errors, 'Syntax error occurred.', filePath, l, null);
    }
  }

  return true;
}

/**
 * Parse .struct content from a string.
 * @param {string} content - The .struct file content as a string.
 * @param {object} [data] - Optional accumulator.
 * @param {object} [report] - Optional report with { def, ref }.
 * @param {Array} [errors] - Optional errors array.
 * @returns {boolean} true on success, false on error.
 */
function getStructFromString(content, data, report, errors) {
  var l = 0;
  var d = 0;

  data = data || {};
  report = report || { def: {}, ref: {} };
  errors = errors || [];

  var lines = content.split(/\r?\n/);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    l++;
    if (line.length < 1) continue;

    try {
      if (RegExp(/^}$/g).test(line)) {
        d = d - 1;
        continue;
      }

      var block = line.match(/(.*?)\s{1}\{$/i);

      if (Array.isArray(block)) {
        d = d + 1;

        switch (d) {
          case 1:
            if (block[1] !== 'STRUCT')
              return addError(
                errors,
                'The starting point for writing a syntax is to write an "STRUCT" that must be written.',
                '<string>',
                l,
                block[0],
              );
            if (data[block[1]]) break;
            data[block[1]] = [];
            break;
          case 2: {
            block = block.input.match(/(.*?)\s{1}(.*?)\{$/i);
            if (!Array.isArray(block))
              return addError(
                errors,
                'Class names must have the structure "([0-9a-zA-Z_]) (.*?) {}"',
                '<string>',
                l,
                null,
              );
            if (RegExp(/^[0-9a-zA-Z_]+$/g).test(block[1]) === false)
              return addError(
                errors,
                'Class names must have the structure "([0-9a-zA-Z_]) (.*?) {}"',
                '<string>',
                l,
                block.input.replace(
                  /(.*?)\s{1}(.*?)\{$/i,
                  (_, m1, m2) =>
                    `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2}{`,
                ),
              );
            data.STRUCT.push({
              PATH: '<string>',
              NAME: block[1],
              MARK: block[2],
              DATA: [],
            });
            report.def[block[1]] = {
              PATH: '<string>',
              LINE: l,
            };
            break;
          }
          case 3: {
            block = block.input.match(/(.*?)\s{1}(.*?)\s{1}([^{]+)/i);
            if (!Array.isArray(block)) break;
            var cur = data.STRUCT.pop();
            cur.DATA.push(getData(block, report.ref, '<string>', l));
            data.STRUCT.push(cur);
            break;
          }
        }

        continue;
      }

      var variable = /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i.exec(line);
      var cur = data.STRUCT.pop();

      switch (d) {
        case 2: {
          if (!Array.isArray(variable))
            return addError(
              errors,
              'Struct must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".',
              '<string>',
              l,
              null,
            );
          if (
            RegExp(
              /^\s*([0-9a-zA-Z_]+)\s{1}([0-9a-zA-Z_[\]]+)\s{1}(.*?)+$/g,
            ).test(variable.input) === false
          )
            return addError(
              errors,
              'Struct data must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".',
              '<string>',
              l,
              variable.input.replace(
                /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i,
                (_, m1, m2, m3) =>
                  `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2.replace(/[^0-9a-zA-Z_\s[\]]/g, '')} ${m3}`,
              ),
            );
          cur.DATA.push(getData(variable, report.ref, '<string>', l));
          break;
        }
        case 3: {
          if (!Array.isArray(variable))
            return addError(
              errors,
              'Struct data must have the structure "([0-9a-zA-Z\uAC00-\uD7A3-_!=><]+) (.*?)".',
              '<string>',
              l,
              null,
            );
          if (
            new RegExp(/^[0-9a-zA-Z\uAC00-\uD7A3-_!=><]+$/g).test(
              variable[1],
            ) === false
          )
            return addError(
              errors,
              'Struct data must have the structure "([0-9a-zA-Z\uAC00-\uD7A3-_!=><]+) (.*?)".',
              '<string>',
              l,
              variable.input.replace(
                /([^\s]+)\s{1}(.*?)$/i,
                (_, m1, m2) =>
                  `${m1.replace(/[^0-9a-zA-Z\uAC00-\uD7A3-_\s!=><]/g, '')} ${m2}`,
              ),
            );
          let pop = cur.DATA.pop();
          pop.OPTION[variable[1]] = [variable[2], variable[3]].join(' ');
          cur.DATA.push(pop);
          break;
        }
      }

      data.STRUCT.push(cur);
    } catch {
      return addError(errors, 'Syntax error occurred.', '<string>', l, null);
    }
  }

  return true;
}

/**
 * Manufacture objects that fit patterns from file paths.
 * @param {Array<string>} paths - Absolute paths to .api files.
 * @param {string} baseDir - Base directory for resolving import paths.
 * @param {Array} errors - Array to collect errors into.
 * @returns {object|false} The parsed data object, or false on error.
 */
function getManufacture(paths, baseDir, errors) {
  var data = {};
  var report = {
    code: {},
    proc: {},
    class: {},
    struct: {
      def: {},
      ref: {},
    },
  };

  for (let path of paths) {
    var d = 0;
    var l = 0;
    var b = null;
    var n = null;

    var liner = new LINE(path);

    for (var line = liner.next(); line; line = liner.next()) {
      l = l + 1;

      try {
        line = line.toString().trim();
        if (line.length < 1) continue;

        if (RegExp(/^}$/g).test(line)) {
          d = d - 1;

          switch (d) {
            case 1: {
              if (n.NAME) {
                data.API.push(n);
                if (!n?.BASE)
                  return addError(
                    errors,
                    'Must contain one of "BASE".',
                    path,
                    n.LINE,
                    n.NAME,
                  );
              }
              break;
            }
            case 2: {
              var pop = n.FUNC.pop();
              if (
                ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'].some((require) =>
                  Object.hasOwn(pop, require),
                )
              ) {
                if (pop.PARAM && pop.PARAM.length > 0) {
                  var reqNames = (pop.REQ || []).map((r) => r.NAME);
                  for (let param of pop.PARAM) {
                    if (!reqNames.includes(param))
                      return addError(
                        errors,
                        `Path parameter ":${param}" must be declared in REQ block.`,
                        path,
                        pop.LINE,
                        pop.NAME,
                      );
                  }
                }
                n.FUNC.push(pop);
                break;
              }
              return addError(
                errors,
                'Must contain one of "GET | PUT | POST | PATCH | DELETE".',
                path,
                pop.LINE,
                pop.NAME,
              );
            }
            case 3: {
              if (b.NAME) {
                pop = n.FUNC.pop();
                pop[b.NAME] = b.DATA;
                n.FUNC.push(pop);
                continue;
              }
              break;
            }
          }

          continue;
        }

        /* Checking import patterns and loading files. */
        if (RegExp(/^(import\s{1}(.*?)$)/g).test(line)) {
          let ext = PATH.extname(line);
          let name = line.replace('import', '').trim();

          if (ext) {
            var importPath = PATH.join(baseDir, name);
            switch (ext) {
              case '.code':
                if (getCode(importPath, data, report.code, errors)) break;
                return false;
              case '.struct':
                if (getStruct(importPath, data, report.struct, errors)) break;
                return false;
            }
            continue;
          }
        }

        var block = line.match(/(.*?)\s{1}\{$/i);

        if (Array.isArray(block)) {
          d = d + 1;

          switch (d) {
            case 1:
              if (block[1] !== 'API')
                return addError(
                  errors,
                  'The starting point for writing a syntax is to write an "API" that must be written.',
                  path,
                  l,
                  block[0],
                );
              if (data[block[1]]) break;
              data[block[1]] = [];
              break;
            case 2: {
              block = block.input.match(/(.*?)\s{1}(.*?)\{$/i);
              if (RegExp(/^[0-9a-zA-Z_]+$/g).test(block[1]) === false)
                return addError(
                  errors,
                  'Class names must have the structure "([0-9a-zA-Z_]) (.*?) {}".',
                  path,
                  l,
                  block.input.replace(
                    /(.*?)\s{1}(.*?)\{$/i,
                    (_, m1, m2) =>
                      `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2}{`,
                  ),
                );
              if (data.API.some((n) => n.NAME === block[1]))
                return addError(
                  errors,
                  'Api with the same class exists.',
                  path,
                  l,
                  block[0],
                );
              n = {
                BASE: null,
                NAME: block[1],
                MARK: block[2],
                FUNC: [],
                LINE: l,
              };
              report.class[block[1]] = {
                PATH: path,
                LINE: l,
                COUNT: 0,
              };
              break;
            }
            case 3: {
              block = block.input.match(/(.*?)\s{1}(.*?)\s{1}([^{]+)/i);
              if (
                RegExp(
                  /^\s*([0-9a-zA-Z_]+)\s{1}([0-9]+)\s{1}(.*?)+$/g,
                ).test(block.input) === false
              )
                return addError(
                  errors,
                  'Api function must have the structure "([0-9a-zA-Z_]) ([0-9]) (.*?)".',
                  path,
                  l,
                  block.input.replace(
                    /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i,
                    (_, m1, m2, m3) =>
                      `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2.replace(/[^0-9]/g, '')} ${m3}`,
                  ),
                );
              if (
                n.FUNC.some(
                  (row) => row.CODE === block[2] || row.NAME === block[1],
                ) ||
                data.API.some((n) =>
                  n.FUNC.some((f) => f.CODE === block[2]),
                )
              )
                return addError(
                  errors,
                  'Api with the same function "name" or "code" exists.',
                  path,
                  l,
                  block[0],
                );
              n.FUNC.push({
                CODE: block[2],
                NAME: block[1],
                DESC: block[3].trim(),
                PATH: path,
                LINE: l,
                PARAM: [],
              });
              report.class[n.NAME].COUNT += 1;
              break;
            }
            case 4: {
              if (
                RegExp(/^(OPT|REQ|RES|PROC|MARK)\s{1}\{/g).test(
                  block.input,
                ) === false
              )
                return addError(
                  errors,
                  'Only the following instructions are allowed to blockcode: OPT, REQ, RES, PROC, MARK.',
                  path,
                  l,
                  null,
                );
              b = { NAME: block[1] };
              switch (b.NAME) {
                case 'REQ':
                case 'RES':
                case 'OPT':
                case 'MARK':
                case 'PROC':
                  b.DATA = [];
                  break;
              }
              break;
            }
            case 5: {
              switch (b.NAME) {
                case 'REQ':
                case 'RES': {
                  block = block.input.match(
                    /(.*?)\s{1}(.*?)\s{1}([^{]+)/i,
                  );
                  b.DATA.push(
                    getData(block, report.struct.ref, path, l),
                  );
                  break;
                }
              }
              break;
            }
          }

          continue;
        }

        var variable = line.match(/([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i);

        switch (d) {
          case 2: {
            if (!Array.isArray(variable)) break;
            if (
              RegExp(/^(BASE)\s{1}[^{](.*?)$/g).test(variable.input) ===
              false
            )
              return addError(
                errors,
                'Only the following instructions are allowed to reserved words: BASE.',
                path,
                l,
                null,
              );
            switch (variable[1]) {
              case 'BASE':
                if (data.API.some((n) => n.BASE === variable[2]))
                  return addError(
                    errors,
                    'Api with the same base name exists.',
                    path,
                    l,
                    variable[2],
                  );
                n.BASE = variable[2];
                continue;
            }
            break;
          }
          case 3: {
            if (!Array.isArray(variable)) break;
            if (
              RegExp(
                /^(COMP|GET|PUT|POST|PATCH|DELETE)\s{1}[^{](.*?)$/g,
              ).test(variable.input) === false
            )
              return addError(
                errors,
                'Only the following instructions are allowed for reserved words: COMP, GET, PUT, POST, PATCH, DELETE.',
                path,
                l,
                null,
              );
            switch (variable[1]) {
              case 'GET':
              case 'PUT':
              case 'POST':
              case 'PATCH':
              case 'DELETE': {
                var cur = n.FUNC.pop();
                for (let method of [
                  'GET',
                  'PUT',
                  'POST',
                  'PATCH',
                  'DELETE',
                ]) {
                  if (cur[method])
                    return addError(
                      errors,
                      'Method is already declared.',
                      path,
                      l,
                      method,
                    );
                }
                if (
                  n.FUNC.some(
                    (row) => row[variable[1]] === variable[2],
                  )
                )
                  return addError(
                    errors,
                    'Api with the same path name exists.',
                    path,
                    l,
                    variable[0],
                  );
                cur[variable[1]] = variable[2];
                var paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
                var paramMatch = paramRegex.exec(variable[2]);
                for (
                  ;
                  paramMatch !== null;
                  paramMatch = paramRegex.exec(variable[2])
                ) {
                  cur.PARAM.push(paramMatch[1]);
                }
                n.FUNC.push(cur);
                continue;
              }
              case 'COMP': {
                if (
                  variable[2] !== 'true' &&
                  variable[2] !== 'false'
                )
                  return addError(
                    errors,
                    'COMP must have the structure "COMP (true|false)".',
                    path,
                    l,
                    null,
                  );
                cur = n.FUNC.pop();
                cur[variable[1]] = JSON.parse(variable[2]);
                n.FUNC.push(cur);
                continue;
              }
            }
            break;
          }
          default: {
            if (d < 4) continue;
            switch (b?.NAME) {
              case 'REQ':
              case 'RES': {
                if (d > 4) {
                  if (
                    !Array.isArray(variable) ||
                    new RegExp(
                      /^\s*[0-9a-zA-Z\uAC00-\uD7A3-_!=><]+$/g,
                    ).test(variable[1]) === false
                  )
                    return addError(
                      errors,
                      `${b.NAME} must have the structure "([0-9a-zA-Z\uAC00-\uD7A3-_!=><]+) (.*?)".`,
                      path,
                      l,
                      null,
                    );
                  pop = b.DATA.pop();
                  pop.OPTION[variable[1]] = [
                    variable[2],
                    variable[3],
                  ].join(' ');
                  b.DATA.push(pop);
                  break;
                }
                if (!Array.isArray(variable))
                  return addError(
                    errors,
                    `${b.NAME} must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".`,
                    path,
                    l,
                    null,
                  );
                if (
                  RegExp(
                    /^\s*([0-9a-zA-Z_]+)\s{1}([0-9a-zA-Z_[\]]+)\s{1}(.*?)+$/g,
                  ).test(variable.input) === false
                )
                  return addError(
                    errors,
                    `${b.NAME} must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".`,
                    path,
                    l,
                    variable.input.replace(
                      /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i,
                      (_, m1, m2, m3) =>
                        `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2.replace(/[^0-9a-zA-Z_\s[\]]/g, '')} ${m3}`,
                    ),
                  );
                b.DATA.push(
                  getData(variable, report.struct.ref, path, l),
                );
                break;
              }
              case 'OPT': {
                if (
                  !Array.isArray(variable) ||
                  new RegExp(
                    /^\s*([0-9a-zA-Z_]+)\s{1}(true|false)$/,
                  ).test(variable.input) === false
                )
                  return addError(
                    errors,
                    `${b.NAME} must have the structure "([0-9a-zA-Z_]+) (true|false)".`,
                    path,
                    l,
                    null,
                  );
                b.DATA.push({
                  NAME: variable[1],
                  VALUE: JSON.parse(variable[2]),
                });
                break;
              }
              case 'MARK': {
                b.DATA.push({
                  NAME: variable[1],
                  MARK: [variable[2], variable[3]].join(' '),
                });
                break;
              }
              case 'PROC': {
                if (
                  !Array.isArray(variable) ||
                  new RegExp(
                    /^\s*([0-9]+)\s{1}([0-9a-zA-Z_]+)\.([0-9a-zA-Z_]+)/g,
                  ).test(variable.input) === false
                )
                  return addError(
                    errors,
                    `${b.NAME} must have the structure "([0-9]+) ([0-9a-zA-Z_]+).([0-9a-zA-Z_]+)".`,
                    path,
                    l,
                    null,
                  );
                b.DATA.push({
                  NAME: variable[2],
                  CODE: variable[1],
                });
                if (report.proc[variable[1]]) {
                  report.proc[variable[1]].COUNT += 1;
                  break;
                }
                report.proc[variable[1]] = {
                  PATH: path,
                  CODE: variable[1],
                  NAME: variable[2],
                  LINE: l,
                  COUNT: 1,
                };
                break;
              }
              default:
                break;
            }
          }
        }
      } catch {
        addError(errors, 'Syntax error occurred.', path, l, null);
        return false;
      }
    }
  }

  /* Object validation. */
  let result = {
    code: [],
    class: [],
  };

  for (let type of ['code', 'class', 'struct']) {
    for (let key of Object.keys(report[type])) {
      let value = report[type][key];
      let error = (() => {
        switch (type) {
          case 'code':
            return [report.class[key], report.struct.def[key]];
          case 'class':
            return [report.code[key], report.struct.def[key]];
          case 'struct':
            return [report.code[key], report.class[key]];
        }
      })().filter((n) => n);

      if (error?.length) {
        return addError(
          errors,
          `Duplicate function name "${key}".`,
          value.PATH,
          value.LINE,
          error.map((r) => `${r.PATH}:${r.LINE}`).join(', '),
        );
      }

      if (result[type]) result[type].push([key, value.COUNT]);
    }
  }

  let def = Object.keys(report.struct.def);

  for (let [key, value] of Object.entries(report.struct.ref)) {
    if (def.includes(key)) continue;
    return addError(
      errors,
      'Structure is not declared.',
      value.PATH,
      value.LINE,
      key,
    );
  }

  for (let [_, value] of Object.entries(report.proc)) {
    let func = (() => {
      for (let n of data.API) {
        let f = n.FUNC.find((f) => f.CODE === value.CODE);
        if (f)
          return {
            CODE: f.CODE,
            NAME: `${n.NAME}.${f.NAME}`,
          };
      }
    })();

    if (!func) {
      return addError(
        errors,
        'Code number specified by PROC name does not exist.',
        value.PATH,
        value.LINE,
        null,
      );
    }

    if (func.NAME !== value.NAME) {
      return addError(
        errors,
        'PROC function name is incorrect.',
        value.PATH,
        value.LINE,
        `${func.CODE} ${func.NAME}`,
      );
    }
  }

  return data;
}

/* ===================================================================
 *  Gen class - File generation helper
 * =================================================================== */

function Gen(path) {
  this.path = path;
  this._buf = [];
  this._encoding = 'utf8';

  FS.mkdirSync(PATH.dirname(this.path), { recursive: true });
}

Gen.prototype.open = function (encoding = 'utf8') {
  this._encoding = encoding;
  this._buf = [];
};

Gen.prototype.close = function () {
  FS.writeFileSync(this.path, this._buf.join(''), { encoding: this._encoding });
  this._buf = [];
};

Gen.prototype.print = function (content) {
  this._buf.push(content);
};

/* ===================================================================
 *  High-level API
 * =================================================================== */

/**
 * Compile .api files from a project directory.
 * Reads api/ folder, resolves imports, and returns the parsed OBJ.
 *
 * @param {string} projectDir - Absolute path to the project directory.
 * @returns {{ success: boolean, data?: object, errors?: Array }}
 */
function compile(projectDir) {
  var errors = [];
  var paths = [];
  var apiDir = PATH.join(projectDir, 'api');

  try {
    for (let entry of FS.readdirSync(apiDir)) {
      var entryPath = PATH.join(apiDir, entry);
      if (FS.lstatSync(entryPath).isDirectory()) continue;
      if (entry.startsWith('._')) continue;
      if (PATH.extname(entry).indexOf('.api') < 0) continue;
      paths.push(entryPath);
    }
  } catch (_error) {
    return {
      success: false,
      errors: [
        {
          message: 'Could not find api directory.',
          path: apiDir,
          line: null,
          details: null,
        },
      ],
    };
  }

  if (paths.length < 1) {
    return {
      success: false,
      errors: [
        {
          message: 'Could not find file with api extension.',
          path: apiDir,
          line: null,
          details: null,
        },
      ],
    };
  }

  var result = getManufacture(paths, projectDir, errors);

  if (result === false || !result) {
    return { success: false, errors: errors };
  }

  return { success: true, data: result };
}

/**
 * Validate .api files without generating code.
 * Same as compile but semantically indicates validation-only intent.
 *
 * @param {string} projectDir - Absolute path to the project directory.
 * @returns {{ success: boolean, data?: object, errors?: Array }}
 */
function validate(projectDir) {
  return compile(projectDir);
}

/**
 * Compile and run pattern files to generate code.
 *
 * @param {string} projectDir - Absolute path to the project directory.
 * @returns {{ success: boolean, data?: object, errors?: Array, generated?: Array<string> }}
 */
function generate(projectDir) {
  var compileResult = compile(projectDir);
  if (!compileResult.success) return compileResult;

  var patterns = [];
  var patternDir = PATH.join(projectDir, 'pattern');

  try {
    for (let entry of FS.readdirSync(patternDir)) {
      if (entry.startsWith('._')) continue;
      if (entry.indexOf('.js') < 0) continue;
      patterns.push(PATH.join(patternDir, entry));
    }
  } catch (_error) {
    return {
      success: false,
      errors: [
        {
          message: 'Could not find pattern directory.',
          path: patternDir,
          line: null,
          details: null,
        },
      ],
    };
  }

  if (patterns.length < 1) {
    return {
      success: false,
      errors: [
        {
          message: 'Could not find pattern file.',
          path: patternDir,
          line: null,
          details: null,
        },
      ],
    };
  }

  var generated = [];
  var errors = [];

  for (let pattern of patterns) {
    try {
      require(pattern)(compileResult.data, Gen);
      generated.push(pattern);
    } catch (error) {
      if (error.message.indexOf('require(...)') > -1) {
        errors.push({
          message:
            'Pattern file must export: module.exports = function( OBJ, GEN ) { }',
          path: pattern,
          line: null,
          details: null,
        });
      } else {
        errors.push({
          message: error.message,
          path: pattern,
          line: null,
          details: error.stack || null,
        });
      }
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      data: compileResult.data,
      errors: errors,
      generated: generated,
    };
  }

  return {
    success: true,
    data: compileResult.data,
    generated: generated,
  };
}

/**
 * Parse a single .api file content string.
 * Supports inline code/struct definitions or no imports.
 *
 * @param {string} content - The .api file content as a string.
 * @param {object} [options] - Options.
 * @param {string} [options.baseDir] - Base directory for resolving import paths.
 * @param {object} [options.preloaded] - Pre-loaded data ({ CODE: [...], STRUCT: [...] }).
 * @returns {{ success: boolean, data?: object, errors?: Array }}
 */
function parseApi(content, options) {
  options = options || {};
  var errors = [];
  var baseDir = options.baseDir || process.cwd();

  /* Write content to a temp file since getManufacture uses n-readlines */
  var tmpDir = PATH.join(
    require('node:os').tmpdir(),
    'accp-' + Date.now() + '-' + Math.random().toString(36).slice(2),
  );
  FS.mkdirSync(tmpDir, { recursive: true });
  var tmpFile = PATH.join(tmpDir, 'input.api');

  try {
    FS.writeFileSync(tmpFile, content, 'utf8');
    var result = getManufacture([tmpFile], baseDir, errors);

    if (result === false || !result) {
      return { success: false, errors: errors };
    }

    /* Merge preloaded data if provided */
    if (options.preloaded) {
      if (options.preloaded.CODE && !result.CODE) {
        result.CODE = options.preloaded.CODE;
      }
      if (options.preloaded.STRUCT && !result.STRUCT) {
        result.STRUCT = options.preloaded.STRUCT;
      }
    }

    return { success: true, data: result };
  } finally {
    /* Clean up temp files */
    try {
      FS.unlinkSync(tmpFile);
      FS.rmdirSync(tmpDir);
    } catch {
      /* ignore cleanup errors */
    }
  }
}

/**
 * Parse a single .code file content string.
 *
 * @param {string} content - The .code file content as a string.
 * @returns {{ success: boolean, data?: object, errors?: Array }}
 */
function parseCode(content) {
  var errors = [];
  var data = {};
  var report = {};

  var result = getCodeFromString(content, data, report, errors);

  if (result === false || !result) {
    return { success: false, errors: errors };
  }

  return { success: true, data: data };
}

/**
 * Parse a single .struct file content string.
 *
 * @param {string} content - The .struct file content as a string.
 * @returns {{ success: boolean, data?: object, errors?: Array }}
 */
function parseStruct(content) {
  var errors = [];
  var data = {};
  var report = { def: {}, ref: {} };

  var result = getStructFromString(content, data, report, errors);

  if (result === false || !result) {
    return { success: false, errors: errors };
  }

  return { success: true, data: data };
}

/* ===================================================================
 *  Exports
 * =================================================================== */

module.exports = {
  compile,
  validate,
  generate,
  parseApi,
  parseCode,
  parseStruct,
  Gen,
};
