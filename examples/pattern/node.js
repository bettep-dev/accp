const PATH = require("path");

const BASE = "out/node";

const LIB = {
  code: {
    /**
     * Code constant and number matching & code number and message output.
     * @param { object } OBJ - https://www.npmjs.com/package/accp#obj
     * @returns
     */
    language: function (OBJ) {
      /* Separation of codes & messages by language. */
      var code = [];
      var value = {};

      for (let CODE of OBJ.CODE) {
        /* Language-specific code messages. */
        code = code.concat(
          [`/* ${CODE.NAME} */`].concat(
            Array.from(
              CODE.CODE,
              (ROW) => `this.${CODE.NAME}_${ROW.NAME} = ${ROW.CODE}`,
            ),
          ),
        );

        /* Separate code objects by language. */
        var mark = {};

        for (let ROW of CODE.CODE) {
          for (let key of Object.keys(ROW.MARK)) {
            if (!value[key]) value[key] = [];

            if (!mark[key]) {
              value[key].push({
                mark: CODE.NAME,
              });

              mark[key] = true;
            }

            value[key].push({
              code: ROW.CODE,
              mark: ROW.MARK[key],
            });
          }
        }
      }

      return [code, value];
    },
  },
  model: {
    /**
     * Parameter description.
     * @param { object } REQ - https://www.npmjs.com/package/accp#obj
     * @param { object } method
     * @param { object } parameter
     * @param { string } template
     * @returns { string }
     */
    mark: function (
      REQ,
      method,
      parameter,
      paths,
      template = "* @param {key} {mark}",
    ) {
      return (
        Array.from(
          parameter.filter((ROW) => ROW.PARAM),
          (ROW) =>
            /* Set custom parameters. */
            template.replace("{key}", ROW.PARAM).replace("{mark}", ROW.MARK),
        ).concat(
          /* Set HTTP parameters. */
          !REQ
            ? []
            : Array.from(REQ, (ROW) =>
                template
                  .replace(
                    "{key}",
                    `${paths?.includes(ROW.NAME) ? "params" : method.PARAM}.${ROW.NAME}`,
                  )
                  .replace("{mark}", ROW.MARK),
              ),
        ) || []
      ).join("\n ");
    },

    /**
     * Response data output.
     * @param { object } FUNC
     * @param { string } template
     * @returns { string }
     */
    response: function (
      FUNC,
      template = `/* {mark} */\n${getTab(2)}response.{name} = DB.get( data, {args} )`,
    ) {
      return (
        !FUNC?.RES
          ? []
          : Array.from(
              /* Processing of excluding certain response values. */
              FUNC.RES.filter((RES) => !["status"].includes(RES.NAME)),
              (RES, index) =>
                template
                  .replace("{mark}", RES.MARK)
                  .replace("{name}", RES.NAME)
                  .replace("{args}", RES.ARRAY ? index : `${index}, 0`),
            )
      ).join("\n\n" + getTab(2));
    },

    /**
     * As a parameter written in the OPT item.
     * Database connection method settings.
     * @param { object } FUNC
     * @returns { string }
     */
    connection: function (FUNC) {
      for (let OPT of FUNC?.OPT || []) {
        /* You can use it further by setting the desired option value. */
        switch (OPT.NAME) {
          case "read":
          case "cache": {
            return OPT.NAME;
          }
        }
      }

      return "write";
    },
  },
  router: {
    /**
     * List of associated APIs.
     * @param { object } PROC - https://www.npmjs.com/package/accp#obj
     */
    proc: function (PROC) {
      if (PROC)
        return Array.from(
          PROC,
          (ROW) => `* * [${ROW.NAME}] ${ROW.MARK || ROW.CODE}`,
        ).join("\n ");

      return "* * notihng";
    },

    /**
     * Additional explanation regarding API.
     * @param { object } MARK - https://www.npmjs.com/package/accp#obj
     */
    mark: function (MARK) {
      if (MARK)
        return Array.from(
          MARK,
          (ROW) =>
            `* * ${ROW.NAME} ${ROW.MARK.replace(/\\n\s\s/g, "\n * * * ")}`,
        ).join("\n ");

      return "* * notihng";
    },

    /**
     * Output of the router method (user-declared function) set in the option value.
     * @param { object } OPTION - https://www.npmjs.com/package/accp#obj
     */
    option: function (OPTION) {
      let o = Array.from(
        OPTION.filter((ROW) => ROW.METHOD),
        (ROW) => ROW.METHOD,
      );

      return o.length ? o.join(", ") + ", " : "";
    },

    /**
     * Check required parameters.
     * @param { object } REQ - https://www.npmjs.com/package/accp#obj
     * @param { object } method - function getMethod struct.
     * @returns
     */
    required: function (
      REQ,
      method,
      paths,
      template = {
        setReq: `/* {mark} */\n${getTab(2)}{name}: req.{param}.{name}`,
        setVal: `/* {mark} */\n${getTab(2)}{name}: FUNC.getVal( req.{param}.{name}, {square} )
      `,
        chkFunc: `/* Declare a function for parameter value existence and data restriction. */ function ( req, res, next ) {\n\n${getTab(1)}let response = FUNC.{function}( req, {\n\n${getTab(2)}{value}\n${getTab(1)}} )\n\n${getTab(1)}if ( response.status?.code ) return res.json( response )\n\n${getTab(1)}return next()\n\n}, `,
      },
    ) {
      if (REQ && REQ.length > 0) {
        var range = [];

        var require = [];

        for (ROW of REQ) {
          if (ROW.OPTION) {
            var square = Object.keys(ROW.OPTION).reduce((prev, cur) => {
              var num = cur.replace(/[^0-9]/g, "");

              if (num) return prev + 2 ** (parseInt(num, 10) + 1);

              return prev;
            }, 0);

            if (square > 0)
              range.push(
                template.setVal
                  .replace("{mark}", ROW.MARK)
                  .replaceAll("{name}", ROW.NAME)
                  .replace(
                    "{param}",
                    paths?.includes(ROW.NAME) ? "params" : method.PARAM,
                  )
                  .replace("{square}", square),
              );
          }

          /* Check required parameters. */
          if (ROW.MARK.indexOf("*") < 0) continue;

          require.push(
            template.setReq
              .replace("{mark}", ROW.MARK)
              .replaceAll("{name}", ROW.NAME)
              .replace(
                "{param}",
                paths?.includes(ROW.NAME) ? "params" : method.PARAM,
              ),
          );
        }

        return [
          require.length
            ? template.chkFunc
                .replace("{function}", "chkReq")
                .replace("{value}", require.join(`,\n${getTab(2)}`))
            : null,

          range.length
            ? template.chkFunc
                .replace("{function}", "chkVal")
                .replace("{value}", range.join(`,\n${getTab(2)}`))
            : null,
        ]
          .filter((code) => code)
          .join("");
      }

      return "";
    },
  },
};

/**
 * Returns tab space.
 * @param { number } depth - indentation depth.
 * @param { string } indentation - Indentation space size.
 * @returns
 */
function getTab(depth, indentation = 2) {
  return "".padEnd(depth * indentation, " ");
}

/**
 * HTTP method information
 * @param { object } FUNC
 * @returns { object }
 */
function getMethod(FUNC) {
  var path = function (path) {
    return path.indexOf("/") > 1 ? path : path.replace("/", "");
  };

  if (FUNC.GET) {
    return {
      PATH: path(FUNC.GET),
      NAME: "get",
      PARAM: "query",
      QUERY: "get",
    };
  }

  if (FUNC.PUT) {
    return {
      PATH: path(FUNC.PUT),
      NAME: "put",
      PARAM: "body",
      QUERY: "put",
    };
  }

  if (FUNC.POST) {
    return {
      PATH: path(FUNC.POST),
      NAME: "post",
      PARAM: "body",
      QUERY: "set",
    };
  }

  if (FUNC.PATCH) {
    return {
      PATH: path(FUNC.PATCH),
      NAME: "patch",
      PARAM: "body",
      QUERY: "put",
    };
  }

  return {
    PATH: path(FUNC.DELETE),
    NAME: "delete",
    PARAM: "query",
    QUERY: "del",
  };
}

/**
 * Convert first letter to uppercase.
 * @param { string } str - Character to convert.
 * @param { boolean } upper - Capitalized or not.
 * @param { boolean } lower - Whether to convert to lowercase except for the first character.
 * @returns { string }
 */
function getCapitalize(str, upper = true, lower = true) {
  return (
    (upper
      ? str.substring(0, 1).toUpperCase()
      : str.substring(0, 1).toLowerCase()) +
    (lower ? str.substring(1).toLowerCase() : str.substring(1))
  );
}

/**
 * As a parameter written in the OPT item.
 * Automatic addition of additional parameters.
 * @param { object } FUNC
 * @returns { array }
 */
function getOPTParameter(FUNC) {
  let parameter = [];

  try {
    for (let opt of FUNC.OPT) {
      switch (opt.NAME) {
        /* You can use it further by setting the desired option value. */
        case "option1": {
          if (opt.VALUE)
            parameter.push({
              METHOD: "FUNC.setOption1",
            });

          break;
        }
        case "option2": {
          if (opt.VALUE)
            parameter.push({
              METHOD: "FUNC.setOption2",
            });

          break;
        }
      }
    }

    return parameter;
  } catch {
    return parameter;
  }
}

/**
 * Generate router file
 */
function setRouter(GEN, API) {
  var out = new GEN(PATH.join(BASE, `router/${API.NAME.toLowerCase()}.js`));

  out.open();

  out.print(
    `

/* dependency */
const ROUTER = require( 'express' ).Router()

/* Virtual file for writing example code. */
const FUNC = require( '..' )

const MODEL = require( '../model/${API.NAME.toLowerCase()}' )

${Array.from(
  API.FUNC.filter((FUNC) => FUNC.COMP),
  (FUNC) => {
    let method = getMethod(FUNC);

    let parameter = getOPTParameter(FUNC);

    return `

/** 
 * Code: ${FUNC.CODE}
 * Complete: ${FUNC.COMP.toString()}
 * Description: ${FUNC.DESC} 
 * 
 * Process: 
 ${LIB.router.proc(FUNC.PROC)}
 *
 * Question:
 ${LIB.router.mark(FUNC.MARK)} */
ROUTER.${method.NAME}( '/${method.PATH}', ${LIB.router.option(parameter)}${LIB.router.required(FUNC.REQ, method, FUNC.PARAM)}async function( req, res ) {

  console.log( new Date(), \`Route.${getCapitalize(method.NAME)} \${ req.baseUrl + req.path }\` )

  return res.json( await MODEL.${getCapitalize(FUNC.NAME, false, false)}( req ) )
} )
`.replace(/^\n+/, "");
  },
).join("\n")}

module.exports = ROUTER`.replace(/^\n+/, ""),
  );

  out.close();
}

/**
 * Generate model file
 */
function setModel(GEN, API) {
  var out = new GEN(PATH.join(BASE, `model/${API.NAME.toLowerCase()}.js`));

  out.open();

  out.print(
    `

/* require */

/* Virtual file for writing example code. */
const DB = require( '..' )
const FUNC = require( '..' )

const CODE = require( '../code/code' )

const QUERY = require( '../query/${API.NAME.toLowerCase()}' )

function ${getCapitalize(API.NAME)} () {}

${((_) =>
  Array.from(API.FUNC, (FUNC) => {
    let method = getMethod(FUNC);

    let parameter = getOPTParameter(FUNC);

    return `

/** 
 * Parameter: 
 ${LIB.model.mark(FUNC.REQ, method, parameter, FUNC.PARAM)}
 */
${getCapitalize(API.NAME)}.prototype.${getCapitalize(FUNC.NAME, false, false)} = async function( req ) {

/* Code for example, please edit it yourself. */
try {

  var connection = await DB.connection.${LIB.model.connection(FUNC)}()

  let data = DB.query( connection, QUERY.${method.QUERY}.any(), req.query || req.body )

  await connection.beginTransaction()

  await connection.commit()

  await connection.release()

  var response = FUNC.getStatus( req, CODE.SYSTEM_SUCCESS ) 

  ${LIB.model.response(FUNC)}

  return response

} catch ( error ) {

  if ( connection ) {

    await connection.rollback()

    await connection.release()
  }

  if ( error && error.message ) {

    console.error( new Date().locale(), error.message )

    return FUNC.getStatus( req, CODE.SYSTEM_DATABASE )
  }

  return FUNC.getStatus( req, error )
}
}
`;
  }))()
  .join("")
  .replace(/^\n+/, "")}

var ${API.NAME.toLowerCase()} = new ${getCapitalize(API.NAME)}()

module.exports = ${API.NAME.toLowerCase()}`.replace(/^\n+/, ""),
  );

  out.close();
}

/**
 * Generate query file.
 */
function setQuery(GEN, API) {
  var out = new GEN(PATH.join(BASE, `query/${API.NAME.toLowerCase()}.js`));

  out.open();

  out.print(`

function ${getCapitalize(API.NAME)}() {}

${getCapitalize(API.NAME)}.prototype.get = {}

${getCapitalize(API.NAME)}.prototype.set = {}

${getCapitalize(API.NAME)}.prototype.put = {}

${getCapitalize(API.NAME)}.prototype.del = {}

var ${API.NAME.toLowerCase()} = new ${getCapitalize(API.NAME)}()

module.exports = ${API.NAME.toLowerCase()}`);

  out.close();
}

/**
 * Generate code file.
 */
function setCode(GEN, OBJ) {
  let [code, value] = LIB.code.language(OBJ);

  var out = new GEN(PATH.join(BASE, "code/code.js"));

  out.open();

  out.print(`

function CODE() {

  ${code.join(`\n${getTab(1)}`)}

  /**
   * Error message returned according to user language settings.
   * @param { string } typeLang
   * @param { number } code
   * @returns { string }
   */
  this.getMessage = function( typeLang, code ) {

    switch ( typeLang.toLowerCase() ) { 

      ${Array.from(
        Object.keys(value),
        (k) => `${k.indexOf("en") > -1 ? "default" : `case '${k}'`}: {

        switch ( code ) {

          ${Array.from(value[k], (r) => (Object.hasOwn(r, "code") ? `case ${r.code}: return '${r.mark}'` : `/* ${r.mark} */`)).join("\n" + getTab(5))}
        }

        break
      }
      `,
      ).join("")}
    }
  }
}

module.exports = new CODE()`);

  out.close();
}

/**
 * @param { object } OBJ - https://www.npmjs.com/package/accp#obj
 * @param { object } GEN - https://www.npmjs.com/package/accp#gen
 */
module.exports = function (OBJ, GEN) {
  for (API of OBJ.API) {
    setRouter(GEN, API);

    setModel(GEN, API);

    setQuery(GEN, API);
  }

  setCode(GEN, OBJ);
};
