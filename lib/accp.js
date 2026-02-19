#!/usr/bin/env node

const FS = require('node:fs');
const PATH = require('node:path');
const COMMAND = require('commander');

/* dependency */
const LINE = require('n-readlines');
const _COLOR = require('colors');

const CONFIG = {
  EXAMPLES: '../examples',
};

function Gen(path) {
  this.path = path;
  this.stream = null;

  if (FS.existsSync(PATH.dirname(this.path))) return;

  FS.mkdirSync(PATH.dirname(this.path), {
    recursive: true,
  });
}

/**
 * Open file write stream.
 * @param { string } [encoding="utf8"] - Encoding format. Default utf8.
 * @returns
 */
Gen.prototype.open = function (encoding = 'utf8') {
  if (this.stream) return;

  this.stream = FS.createWriteStream(this.path, {
    encoding: encoding,
  });
};

/**
 * Close the file write stream.
 */
Gen.prototype.close = function () {
  if (this.stream) {
    this.stream.end();

    this.stream = null;
  }
};

/**
 * Write stream.
 * @param { string } content - What to write to the stream..
 * @returns
 */
Gen.prototype.print = function (content) {
  if (!this.stream) return;

  this.stream.write(content);
};

/* System Function */
/**
 * Log output
 * @param { string } content - Title to print.
 * @param { string } color - Color name.
 * @param { array< string > } array - Detailed output contents.
 * @param { string } prefix - Verbose output prefix.
 */
function setLog(content, color, array = [], prefix = '  ') {
  setPrint('*', content, color);

  if (array.length > 0) {
    array = JSON.parse(JSON.stringify(array));

    let cur = array.pop();

    for (row of array) {
      if (Array.isArray(row)) {
        setPrint(`${prefix}├`, row.join(' :: '), color);
      } else {
        setPrint(`${prefix}├`, row, color);
      }
    }

    if (Array.isArray(cur)) {
      setPrint(`${prefix}└`, cur.join(' :: '), color);

      console.log();
    } else {
      setPrint(`${prefix}└`, cur, color);

      console.log();
    }
  }

  return false;
}

/**
 * Generate output file.
 * @param { string } dir - Folder name in which to create files.
 * @param { string } loc - Path where the list of files to be created is located.
 * @param { string } spc - Space character.
 * @param { string } sep - Separator character.
 */
function setFile(dir, loc, spc = '', sep = ' ') {
  let entries = FS.readdirSync(loc);

  entries.forEach((entry) => {
    let path = PATH.join(loc, entry);

    if (FS.lstatSync(path).isDirectory()) {
      FS.mkdirSync(PATH.join(dir, entry));

      let prefix = entries[entries.length - 1] === entry ? '└' : '├';

      setPrint(`* ${spc}${prefix}`, entry, 'brightGreen');

      setFile(PATH.join(dir, entry), path, spc + sep);
    } else {
      FS.writeFileSync(PATH.join(dir, entry), FS.readFileSync(path));
    }
  });
}

/**
 * Print console.log ( https://www.npmjs.com/package/colors )
 * @param { string } prefix - A prefix that follows the colors format.
 * @param { string } content - Content that follows the colors format.
 * @param { string } color - Color name.
 * @returns
 */
function setPrint(prefix, content, color = 'white') {
  if (content) {
    console.log(prefix.white, content[color]);

    return;
  }

  console.log(prefix.white);
}

/**
 * Code generation.
 */
function setExcute() {
  var paths = [];
  var patterns = [];

  var api = PATH.join(process.cwd(), 'api');

  try {
    for (let entry of FS.readdirSync(api)) {
      var path = PATH.join(api, entry);

      if (FS.lstatSync(path).isDirectory()) continue;

      if (entry.startsWith('._')) continue;

      if (PATH.extname(entry).indexOf('.api') < 0) continue;

      paths.push(path);
    }
  } catch (_error) {
    setLog('Could not find api file', 'brightRed');

    return;
  }

  if (paths.length < 1) {
    setLog('Could not find file with api extension', 'brightRed');

    return;
  }

  setLog('Checked api file', 'white', paths);

  let pattern = PATH.join(process.cwd(), 'pattern');

  try {
    for (let entry of FS.readdirSync(pattern)) {
      if (entry.startsWith('._')) continue;

      if (entry.indexOf('.js') < 0) continue;

      patterns.push(PATH.join(pattern, entry));
    }
  } catch (_error) {
    setLog('Could not find pattern file', 'brightRed');

    return;
  }

  if (patterns.length < 1) {
    setLog('Could not find pattern file', 'brightRed');

    return;
  }

  setLog('Checked pattern file', 'white', patterns);

  for (path of paths) {
    setLog('Start pattern process', 'brightMagenta', [path]);

    var manufacture = getManufacture([path]);

    if (manufacture) {
      var created = [];

      for (let pattern of patterns) {
        try {
          require(pattern)(manufacture, Gen);

          created.push(pattern);
        } catch (error) {
          if (error.message.indexOf('require(...)') > -1) {
            setLog(
              'Include the following code in your pattern file.',
              'brightRed',
              [pattern],
            );

            setLog(
              'module.exports = function( OBJ, GEN ) { /* Please write your code */ }\n',
              'white',
            );

            return;
          }

          setLog(error.message, 'brightRed', [pattern]);
        }
      }

      if (created.length > 0)
        setLog('Create pattern', 'brightBlue', created);

      setPrint('*', 'Complete pattern process', 'brightMagenta');
    }
  }
}

/**
 * Create example file.
 */
function setExamples() {
  var loc = PATH.join(__dirname, CONFIG.EXAMPLES);
  var dir = PATH.join(process.cwd(), COMMAND.examples);

  setPrint('*', COMMAND.examples, 'brightGreen');

  if (FS.existsSync(dir)) {
    setLog(`The "${COMMAND.examples}" folder exists.`, 'brightRed');

    return;
  }

  FS.mkdirSync(dir);

  setFile(dir, loc);
}

/**
 * Create detailed data structures.
 * @param { array < string > } variable - Parsing data.
 * @param { object } report - Same level structure object.
 * @param { string } path
 * @param { string } line
 */
function getData(variable, report, path, line) {
  let name = variable[2].replace(/(\[|\])/g, '');

  switch (name.toLowerCase()) {
    case 'int':
    case 'data':
    case 'float':
    case 'double':
    case 'string':
    case 'boolean': {
      break;
    }

    default: {
      if (report[name]) {
        report[name].COUNT += 1;

        break;
      }

      report[name] = {
        PATH: path,
        LINE: line,
        COUNT: 1,
      };

      break;
    }
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
 * System, error code generation.
 * @param { string } path - File path that needs reference for code generation(*.code).
 * @param { object } data - Generated code object.
 * @param { object } report - An object for outputting creation results.
 * @returns
 */
function getCode(path, data, report) {
  var d = 0;
  var l = 0;
  var n = null;
  var p = PATH.join(process.cwd(), path);

  if (FS.existsSync(p) === false)
    return setLog('Code file not found.', 'brightRed', [p]);

  /* Read file line by line. */
  var liner = new LINE(p);

  for (line = liner.next(); line; line = liner.next()) {
    l++;

    line = line.toString().trim();

    if (line.length < 1) continue;

    /* Check the end of the line. */
    if (RegExp(/^}$/g).test(line)) {
      d = d - 1;

      switch (d) {
        case 1: {
          if (n.NAME) data.CODE.push(n);

          break;
        }
      }

      continue;
    }

    var block = line.match(/(.*?)\s{1}\{$/i);

    if (Array.isArray(block)) {
      d = d + 1;

      switch (d) {
        case 1: {
          if (block[1] !== 'CODE')
            return setLog(
              'The starting point for writing a syntax is to write an "CODE" that must be written.',
              'brightRed',
              [[p, l], block[0]],
            );

          if (data[block[1]]) break;

          /* Init */
          data[block[1]] = [];

          break;
        }
        case 2: {
          block = block.input.match(/(.*?)\s{1}(.*?)\{$/i);

          if (!Array.isArray(block))
            setLog(
              'Code names must have the structure "([0-9a-zA-Z_]) (.*?) {}".',
              'brightRed',
              [[path, l]],
            );

          if (RegExp(/^[0-9a-zA-Z_]+$/g).test(block[1]) === false)
            return setLog(
              'Code names must have the structure "([0-9a-zA-Z_]) (.*?) {}".',
              'brightRed',
              [
                [path, l],
                block.input.replace(
                  /(.*?)\s{1}(.*?)\{$/i,
                  (_, m1, m2) => `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2}{`,
                ),
              ],
            );

          if (data.CODE.some((row) => row.NAME === block[1]))
            return setLog('Code with the same class exists.', 'brightRed', [
              [p, l],
              block[0],
            ]);

          n = {
            NAME: block[1],
            MARK: block[2],
            CODE: [],
          };

          report[block[1]] = {
            PATH: p,
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
            return setLog(
              'Code must have the structure "([0-9]+) (.*?) {}',
              'brightRed',
              [[p, l]],
            );

          if (
            n.CODE.some(
              (row) => row.CODE === block[1] || row.NAME === block[2],
            ) ||
            data.CODE.some((row) => row.CODE.some((c) => c.CODE === block[1]))
          )
            return setLog(
              'Code with the same "name" or "code" exists.',
              'brightRed',
              [[p, l], block[0]],
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
            return setLog(
              'Code data must have the structure "([0-9a-zA-Z_) (.*?)".',
              'brightRed',
              [[p, l]],
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
 * Create structure file.
 * @param { string } path - File path that needs reference for structure generation(*.struct).
 * @param { object } data - Generated structure object.
 * @param { object } report - An object for outputting creation results.
 * @returns
 */
function getStruct(path, data, report) {
  var l = 0;
  var d = 0;
  var p = PATH.join(process.cwd(), path);

  if (FS.existsSync(p) === false)
    return setLog('Structure file not found.', 'brightRed', [p]);

  /* Read file line by line. */
  var liner = new LINE(p);

  for (line = liner.next(); line; line = liner.next()) {
    l++;

    try {
      line = line.toString().trim();

      if (line.length < 1) continue;

      /* Check the end of the line. */
      if (RegExp(/^}$/g).test(line)) {
        d = d - 1;

        continue;
      }

      var block = line.match(/(.*?)\s{1}\{$/i);

      if (Array.isArray(block)) {
        d = d + 1;

        switch (d) {
          case 1: {
            if (block[1] !== 'STRUCT')
              return setLog(
                'The starting point for writing a syntax is to write an "STRUCT" that must be written.',
                'brightRed',
                [[p, l], block[0]],
              );

            if (data[block[1]]) break;

            /* Init */
            data[block[1]] = [];

            break;
          }
          case 2: {
            block = block.input.match(/(.*?)\s{1}(.*?)\{$/i);

            if (!Array.isArray(block))
              return setLog(
                'Class names must have the structure "([0-9a-zA-Z_]) (.*?) {}"',
                'brightRed',
                [[p, l]],
              );

            if (RegExp(/^[0-9a-zA-Z_]+$/g).test(block[1]) === false)
              return setLog(
                'Class names must have the structure "([0-9a-zA-Z_]) (.*?) {}"',
                'brightRed',
                [
                  [p, l],
                  block.input.replace(
                    /(.*?)\s{1}(.*?)\{$/i,
                    (_, m1, m2) =>
                      `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2}{`,
                  ),
                ],
              );

            data.STRUCT.push({
              PATH: path,
              NAME: block[1],
              MARK: block[2],
              DATA: [],
            });

            report.def[block[1]] = {
              PATH: p,
              LINE: l,
            };

            break;
          }
          case 3: {
            block = block.input.match(/(.*?)\s{1}(.*?)\s{1}([^{]+)/i);

            if (!Array.isArray(block)) break;

            var cur = data.STRUCT.pop();

            cur.DATA.push(getData(block, report.ref, p, l));

            data.STRUCT.push(cur);

            break;
          }
        }

        continue;
      }

      var variable = /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i.exec(line);

      cur = data.STRUCT.pop();

      switch (d) {
        case 2: {
          if (!Array.isArray(variable))
            return setLog(
              'Struct must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".',
              'brightRed',
              [[p, l]],
            );

          if (
            RegExp(
              /^\s*([0-9a-zA-Z_]+)\s{1}([0-9a-zA-Z_[\]]+)\s{1}(.*?)+$/g,
            ).test(variable.input) === false
          )
            return setLog(
              'Struct data must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".',
              'brightRed',
              [
                [p, l],
                variable.input.replace(
                  /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i,
                  (_, m1, m2, m3) =>
                    `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2.replace(/[^0-9a-zA-Z_\s[\]]/g, '')} ${m3}`,
                ),
              ],
            );

          cur.DATA.push(getData(variable, report.ref, p, l));

          break;
        }
        case 3: {
          if (!Array.isArray(variable))
            return setLog(
              'Struct data must have the structure "([0-9a-zA-Z가-힣-_!=><]+) (.*?)".',
              'brightRed',
              [[p, l]],
            );

          if (
            new RegExp(/^[0-9a-zA-Z가-힣-_!=><]+$/g).test(variable[1]) === false
          )
            return setLog(
              'Struct data must have the structure "([0-9a-zA-Z가-힣-_!=><]+) (.*?)".',
              'brightRed',
              [
                [p, l],
                variable.input.replace(
                  /([^\s]+)\s{1}(.*?)$/i,
                  (_, m1, m2) =>
                    `${m1.replace(/[^0-9a-zA-Z가-힣-_\s!=><]/g, '')} ${m2}`,
                ),
              ],
            );

          let pop = cur.DATA.pop();

          pop.OPTION[variable[1]] = [variable[2], variable[3]].join(' ');

          cur.DATA.push(pop);

          break;
        }
      }

      data.STRUCT.push(cur);
    } catch {
      return setLog('Syntax error occurred.', 'brightRed', [[p, l]]);
    }
  }

  return true;
}

/**
 * Manufacture objects that fit patterns.
 * @param { array< string > } paths - Pattern file list.
 * @returns
 */
function getManufacture(paths) {
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

    for (line = liner.next(); line; line = liner.next()) {
      l = l + 1;

      try {
        line = line.toString().trim();

        if (line.length < 1) continue;

        /* Check the end of the line. */
        if (RegExp(/^}$/g).test(line)) {
          d = d - 1;

          /* Validate required items. */
          switch (d) {
            case 1: {
              if (n.NAME) {
                data.API.push(n);

                if (!n?.BASE)
                  return setLog('Must contain one of "BASE".', 'brightRed', [
                    [path, n.LINE],
                    n.NAME,
                  ]);
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
                /* Validate path parameters exist in REQ */
                if (pop.PARAM && pop.PARAM.length > 0) {
                  var reqNames = (pop.REQ || []).map((r) => r.NAME);

                  for (let param of pop.PARAM) {
                    if (!reqNames.includes(param))
                      return setLog(
                        `Path parameter ":${param}" must be declared in REQ block.`,
                        'brightRed',
                        [[path, pop.LINE], pop.NAME],
                      );
                  }
                }

                n.FUNC.push(pop);

                break;
              }

              return setLog(
                'Must contain one of "GET | PUT | POST | PATCH | DELETE".',
                'brightRed',
                [[path, pop.LINE], pop.NAME],
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
            switch (ext) {
              case '.code': {
                if (getCode(name, data, report.code)) break;

                return false;
              }

              case '.struct': {
                if (getStruct(name, data, report.struct)) break;

                return false;
              }
            }

            continue;
          }
        }

        var block = line.match(/(.*?)\s{1}\{$/i);

        if (Array.isArray(block)) {
          d = d + 1;

          switch (d) {
            case 1: {
              if (block[1] !== 'API')
                return setLog(
                  'The starting point for writing a syntax is to write an "API" that must be written.',
                  'brightRed',
                  [[path, l], block[0]],
                );

              if (data[block[1]]) break;

              /* Init */
              data[block[1]] = [];

              break;
            }
            case 2: {
              block = block.input.match(/(.*?)\s{1}(.*?)\{$/i);

              if (RegExp(/^[0-9a-zA-Z_]+$/g).test(block[1]) === false)
                return setLog(
                  'Class names must have the structure "([0-9a-zA-Z_]) (.*?) {}".',
                  'brightRed',
                  [
                    [path, l],
                    block.input.replace(
                      /(.*?)\s{1}(.*?)\{$/i,
                      (_, m1, m2) =>
                        `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2}{`,
                    ),
                  ],
                );

              if (data.API.some((n) => n.NAME === block[1]))
                return setLog('Api with the same class exists.', 'brightRed', [
                  [path, l],
                  block[0],
                ]);

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
                RegExp(/^\s*([0-9a-zA-Z_]+)\s{1}([0-9]+)\s{1}(.*?)+$/g).test(
                  block.input,
                ) === false
              )
                return setLog(
                  `Api function must have the structure "([0-9a-zA-Z_]) ([0-9]) (.*?)".`,
                  'brightRed',
                  [
                    [path, l],
                    block.input.replace(
                      /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i,
                      (_, m1, m2, m3) =>
                        `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2.replace(/[^0-9]/g, '')} ${m3}`,
                    ),
                  ],
                );

              if (
                n.FUNC.some(
                  (row) => row.CODE === block[2] || row.NAME === block[1],
                ) ||
                data.API.some((n) => n.FUNC.some((f) => f.CODE === block[2]))
              )
                return setLog(
                  'Api with the same function "name" or "code" exists.',
                  'brightRed',
                  [[path, l], block[0]],
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
                RegExp(/^(OPT|REQ|RES|PROC|MARK)\s{1}\{/g).test(block.input) ===
                false
              )
                return setLog(
                  'Only the following instructions are allowed to blockcode.',
                  'brightRed',
                  [[path, l], 'OPT', 'REQ', 'RES', 'PROC', 'MARK'],
                );

              b = {
                NAME: block[1],
              };

              switch (b.NAME) {
                case 'REQ':
                case 'RES':
                case 'OPT':
                case 'MARK':
                case 'PROC': {
                  b.DATA = [];

                  break;
                }
              }

              break;
            }
            case 5: {
              switch (b.NAME) {
                case 'REQ':
                case 'RES': {
                  block = block.input.match(/(.*?)\s{1}(.*?)\s{1}([^{]+)/i);

                  b.DATA.push(getData(block, report.struct.ref, path, l));

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
              RegExp(/^(BASE)\s{1}[^{](.*?)$/g).test(variable.input) === false
            )
              return setLog(
                'Only the following instructions are allowed to reserved words.',
                'brightRed',
                [[path, l], 'BASE'],
              );

            switch (variable[1]) {
              case 'BASE': {
                if (data.API.some((n) => n.BASE === variable[2]))
                  return setLog(
                    `Api with the same base name exists.`,
                    'brightRed',
                    [[path, l], variable[2]],
                  );

                n.BASE = variable[2];

                continue;
              }
            }

            break;
          }
          case 3: {
            if (!Array.isArray(variable)) break;

            if (
              RegExp(/^(COMP|GET|PUT|POST|PATCH|DELETE)\s{1}[^{](.*?)$/g).test(
                variable.input,
              ) === false
            )
              return setLog(
                'Only the following instructions are allowed for reserved words, and bracket characters are not allowed.',
                'brightRed',
                [[path, l], 'COMP', 'GET | PUT | POST | PATCH | DELETE'],
              );

            switch (variable[1]) {
              case 'GET':
              case 'PUT':
              case 'POST':
              case 'PATCH':
              case 'DELETE': {
                var cur = n.FUNC.pop();

                for (let method of ['GET', 'PUT', 'POST', 'PATCH', 'DELETE']) {
                  if (cur[method])
                    return setLog(`Method is already declared.`, 'brightRed', [
                      [path, l],
                      method,
                    ]);
                }

                if (n.FUNC.some((row) => row[variable[1]] === variable[2]))
                  return setLog(
                    'Api with the same path name exists.',
                    'brightRed',
                    [[path, l], variable[0]],
                  );

                cur[variable[1]] = variable[2];

                /* Extract path parameters */
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
                if (variable[2] !== 'true' && variable[2] !== 'false')
                  return setLog(
                    'COMP must have the structure "COMP (true|false)".',
                    'brightRed',
                    [[path, l]],
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
            /* Create block data */
            if (d < 4) continue;

            switch (b?.NAME) {
              case 'REQ':
              case 'RES': {
                if (d > 4) {
                  if (
                    !Array.isArray(variable) ||
                    new RegExp(/^\s*[0-9a-zA-Z가-힣-_!=><]+$/g).test(
                      variable[1],
                    ) === false
                  )
                    return setLog(
                      `${b.NAME} must have the structure "([0-9a-zA-Z가-힣-_!=><]+) (.*?)".`,
                      'brightRed',
                      [[path, l]],
                    );

                  pop = b.DATA.pop();

                  pop.OPTION[variable[1]] = [variable[2], variable[3]].join(
                    ' ',
                  );

                  b.DATA.push(pop);

                  break;
                }

                if (!Array.isArray(variable))
                  return setLog(
                    `${b.NAME} must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)".`,
                    'brightRed',
                    [[path, l]],
                  );

                if (
                  RegExp(
                    /^\s*([0-9a-zA-Z_]+)\s{1}([0-9a-zA-Z_[\]]+)\s{1}(.*?)+$/g,
                  ).test(variable.input) === false
                )
                  return setLog(
                    `${b.NAME} must have the structure "([0-9a-zA-Z_]+) ([0-9a-zA-Z_[]]+) (.*?)". Change it to "${replace}".`,
                    'brightRed',
                    [
                      [path, l],
                      variable.input.replace(
                        /([^\s]+)\s{1}([^\s]+)\s?(.*?)$/i,
                        (_, m1, m2, m3) =>
                          `${m1.replace(/[^0-9a-zA-Z_\s]/g, '')} ${m2.replace(/[^0-9a-zA-Z_\s[\]]/g, '')} ${m3}`,
                      ),
                    ],
                  );

                b.DATA.push(getData(variable, report.struct.ref, path, l));

                break;
              }
              case 'OPT': {
                if (
                  !Array.isArray(variable) ||
                  new RegExp(/^\s*([0-9a-zA-Z_]+)\s{1}(true|false)$/).test(
                    variable.input,
                  ) === false
                )
                  return setLog(
                    `${b.NAME} must have the structure "([0-9a-zA-Z_]+) (true|false)".`,
                    'brightRed',
                    [[path, l]],
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
                  return setLog(
                    `${b.NAME} must have the structure "([0-9]+) ([0-9a-zA-Z_]+).([0-9a-zA-Z_]+)".`,
                    'brightRed',
                    [[path, l]],
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
              default: {
                break;
              }
            }
          }
        }
      } catch {
        setLog('Syntax error occurred.', 'brightRed', [[path, l]]);

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
          case 'code': {
            return [report.class[key], report.struct.def[key]];
          }
          case 'class': {
            return [report.code[key], report.struct.def[key]];
          }
          case 'struct': {
            return [report.code[key], report.class[key]];
          }
        }
      })().filter((n) => n);

      if (error?.length)
        return setLog(
          `Duplicate function name "${key}".`,
          'brightRed',
          error.map((r) => [r.PATH, r.LINE]).concat([[value.PATH, value.LINE]]),
        );

      if (result[type]) result[type].push([key, value.COUNT]);
    }
  }

  let def = Object.keys(report.struct.def);

  for (let [key, value] of Object.entries(report.struct.ref)) {
    if (def.includes(key)) continue;

    return setLog('Structure is not declared.', 'brightRed', [
      [value.PATH, value.LINE],
      key,
    ]);
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

    if (!func)
      return setLog(
        `Code number specified by PROC name does not exist.`,
        'brightRed',
        [[value.PATH, value.LINE]],
      );

    if (func.NAME !== value.NAME)
      return setLog(`PROC function name is incorrect.`, 'brightRed', [
        [value.PATH, value.LINE],
        `${func.CODE} ${func.NAME}`,
      ]);
  }

  setLog('Code count', 'brightGreen', result.code);

  setLog('Class count', 'brightGreen', result.class);

  setLog('Struct count', 'brightGreen', [
    [Object.keys(report.struct.def).length],
  ]);

  return data;
}

/**
 * Generating shell commands.
 */
COMMAND.version('1.4.4');

COMMAND.option('-c, --compile', 'Compile patterns').option(
  '-e, --examples <folder>',
  'Generate an example file',
);

COMMAND.parse(process.argv);

if (COMMAND.c || COMMAND.compile) {
  setPrint('\n!', 'Start accp compile.\n', 'yellow');

  setExcute();

  setPrint('\n!', 'Complete accp compile.\n', 'yellow');

  process.exit(0);
}

if (COMMAND.e || COMMAND.examples) {
  setPrint('\n!', 'Start accp make examples file.\n', 'yellow');

  setExamples();

  setPrint('\n!', 'Complete accp make examples file.\n', 'yellow');

  process.exit(0);
}
