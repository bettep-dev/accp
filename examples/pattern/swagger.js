const PATH = require("path");

const BASE = "out/swagger";

const LIB = {
  path: {
    /**
     * Create requestBody structure.
     * @param REQ - https://www.npmjs.com/package/accp#obj
     * @param json - https://swagger.io/specification/v2/?sbsearch=Basic%20Structure%20Swagger
     */
    body: function (REQ, json, paths) {
      var properties = {};

      var encoding = {};

      var requires = [];

      var request = {
        content: {
          "application/x-www-form-urlencoded": {
            schema: {
              type: "object",
              required: requires,
              properties: properties,
            },
            encoding: encoding,
          },
        },
      };

      if (REQ) {
        for (ROW of REQ) {
          if (paths?.includes(ROW.NAME)) continue;

          if (getRequired(ROW.MARK)) requires.push(ROW.NAME);

          properties[ROW.NAME] = getProperty(ROW, json);

          if (
            properties[ROW.NAME].type === "object" ||
            properties[ROW.NAME].type === "array"
          )
            encoding[ROW.NAME] = {
              contentType: "application/json",
            };
        }

        return request;
      } else {
        return null;
      }
    },

    /**
     * Whether to set option value.
     * @param { object } OPT - https://www.npmjs.com/package/accp#obj
     */
    option: function (OPT) {
      var option = {
        token: false,
      };

      for (let ROW of OPT || []) {
        switch (ROW.NAME) {
          /* You can use it further by setting the desired option value. */
          case "token": {
            option.token = ROW.VALUE;

            break;
          }
        }
      }

      return option;
    },

    /**
     * Generating API response results.
     * @param { object } RES - https://www.npmjs.com/package/accp#obj
     * @returns
     */
    response: function (RES) {
      var properties = {
        status: {
          $ref: "#/components/schemas/Status",
        },
      };

      var response = {
        default: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: properties,
              },
            },
          },
          description: "응답 결과",
        },
      };

      for (ROW of RES || []) properties[ROW.NAME] = getProperty(ROW);

      return response;
    },

    /**
     * Create API request parameters.
     * @param { object } REQ - https://www.npmjs.com/package/accp#obj
     * @returns
     */
    parameters: function (REQ, paths) {
      var parameters = [];

      if (!REQ) return null;

      for (ROW of REQ) {
        let isPathParam = paths?.includes(ROW.NAME);

        let required = isPathParam || getRequired(ROW.MARK);

        var query = {
          in: isPathParam ? "path" : "query",
          name: ROW.NAME,
          schema: getProperty(ROW),
          required: required,
          description: ROW.MARK + getOption(ROW.OPTION),
        };

        if (!required) query.schema.nullable = true;

        parameters.push(setAttribute(query));
      }

      return parameters;
    },

    /**
     * Write an API description.
     * https://www.npmjs.com/package/accp#obj
     * @param OBJ
     * @param API
     * @param FUNC
     */
    description: function (OBJ, API, FUNC) {
      var desc = [];

      if (FUNC.PROC && FUNC.PROC.length > 0) {
        desc.push("### Relation.");

        for (ROW of FUNC.PROC) {
          var target = null;

          for (let A of OBJ.API) {
            target = A.FUNC.find((F) => F.CODE === ROW.CODE);

            if (target) break;
          }

          let base = ROW.NAME.split(".")[0].toLowerCase();

          let path = getPath(API, target).substring(1).split("/")[1];

          let method = getMethod(target);

          if (path) {
            desc.push(
              `* [[${target.CODE}] ${target.DESC}](#${base}/${method}_${base}_${path}).`,
            );
          } else {
            desc.push(
              `* [[${target.CODE}] ${target.DESC}](#${base}/${method}_${base}).`,
            );
          }
        }
      }

      if (FUNC.MARK && FUNC.MARK.length > 0) {
        desc.push("### Description.");

        for (ROW of FUNC.MARK)
          desc.push(
            `${ROW.NAME} ${ROW.MARK || ROW.CODE}`.replace(/\\n/g, "\n"),
          );
      }

      return desc.length > 0 ? desc.join("\n") : null;
    },
  },

  /**
   * Create structure schema.
   * https://www.npmjs.com/package/accp#obj
   * @param { object } STRUCT
   * @returns
   */
  schema: function (STRUCT) {
    var schema = {
      required: [],
      properties: new Object(),
    };

    if (STRUCT) {
      for (ROW of STRUCT) {
        schema.properties[ROW.NAME] = getProperty(ROW);

        if (getRequired(ROW.MARK)) {
          schema.required.push(ROW.NAME);
        } else {
          schema.properties[ROW.NAME].default = "null";
        }
      }
    }

    return schema;
  },
};

/**
 * Outputs a value if the condition is true.
 * @param { object } condition
 * @param { string } data
 * @returns
 */
function setIf(condition, data) {
  return condition ? data : "";
}

/**
 * If there is no value, delete the corresponding key value.
 * @param { object } obj - A dictionary object consisting of key and value.
 * @returns
 */
function setAttribute(obj) {
  for (key of Object.keys(obj)) {
    if (key === "example") continue;

    if (obj[key]) {
      if (Array.isArray(obj[key]) && obj[key].length > 0) continue;

      if (obj[key] instanceof Object) {
        obj[key] = setAttribute(obj[key]);

        continue;
      }

      continue;
    }

    delete obj[key];
  }

  return obj;
}

/**
 * Create an API route.
 * https://www.npmjs.com/package/accp#obj
 * @param { object } API
 * @param { object } FUNC
 * @returns
 */
function getPath(API, FUNC) {
  let method = FUNC.GET || FUNC.PUT || FUNC.POST || FUNC.PATCH || FUNC.DELETE;

  let path = PATH.join(
    "/",
    API.NAME.toLowerCase(),
    method.length > 1 ? method : method.replace("/", ""),
  );

  return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "{$1}");
}

/**
 * Returns the HTTP method name.
 * @param { object } FUNC - https://www.npmjs.com/package/accp#obj
 * @returns
 */
function getMethod(FUNC) {
  if (FUNC.GET) return "get";

  if (FUNC.PUT) return "put";

  if (FUNC.POST) return "post";

  if (FUNC.PATCH) return "patch";

  if (FUNC.DELETE) return "delete";

  return null;
}

/**
 * Returns detailed option values.
 * @param { object } OPTION - https://www.npmjs.com/package/accp#obj
 * @returns
 */
function getOption(OPTION) {
  try {
    return Array.from(Object.keys(OPTION), (key) =>
      `\n* ${key} ${OPTION[key]}`.replace(/\\n/g, "\n"),
    ).join("");
  } catch {
    return null;
  }
}

/**
 * @param { object } ROW - https://www.npmjs.com/package/accp#obj
 * @param { object } json -
 */
function getProperty(ROW, json = null) {
  var object = ((_) => {
    switch (ROW.CLASS) {
      case "Int": {
        if (ROW.ARRAY)
          return {
            type: "array",
            items: {
              type: "integer",
              format: ROW.CLASS + 32,
            },
          };

        return {
          type: "integer",
          format: ROW.CLASS + 32,
        };
      }
      case "Float": {
        if (ROW.ARRAY)
          return {
            type: "array",
            items: {
              type: "number",
              format: ROW.CLASS,
            },
          };

        return {
          type: "number",
          format: ROW.CLASS,
        };
      }
      case "Double": {
        if (ROW.ARRAY)
          return {
            type: "array",
            items: {
              type: "number",
              format: ROW.CLASS,
            },
          };

        return {
          type: "number",
          format: ROW.CLASS,
        };
      }
      case "String": {
        if (ROW.ARRAY)
          return {
            type: "array",
            items: {
              type: "string",
            },
          };

        return {
          type: "string",
        };
      }
      case "Boolean": {
        if (ROW.ARRAY)
          return {
            type: "array",
            items: {
              type: "boolean",
            },
          };

        return {
          type: "boolean",
          default: "false",
        };
      }
      case "Data": {
        if (ROW.ARRAY)
          return {
            type: "array",
            items: {
              type: "object",
            },
          };

        return {
          type: "object",
        };
      }
      default: {
        if (ROW.ARRAY)
          return {
            type: "array",
            items: {
              $ref: "#/components/schemas/" + ROW.CLASS,
            },
          };

        return {
          type: "object",
          allOf: [
            {
              $ref: "#components/schemas/" + ROW.CLASS,
            },
          ],
        };
      }
    }
  })();

  if (json) {
    if (object.items?.$ref || object.allOf) {
      let model = ((schemas) => {
        let struct = schemas[ROW.CLASS];

        var example = {};

        var description = new Array();

        for (let key of Object.keys(struct.properties)) {
          let required = (struct.required || []).indexOf(key) > -1;

          let property = struct.properties[key];

          example[key] = required ? property.type : null;

          description.push(
            `

          <tr>
            <td>${required ? `<b>${key}<span> \\*</span></b>` : key}</td>
            <td>
              <span>${property.type}</span>
              <span>${setIf(property.format, `($${property.format})`)}</span>
              <div>
                <p>${property.description}</p>
              </div>
            </td>
          </tr>`.trim(),
          );
        }

        return {
          example: example,
          description: `

          <details>
            <summary>${ROW.MARK}</summary>
            <table>
              <tbody>${description.join("")}</tbody>
            </table>
          </details>${getOption(ROW.OPTION)}`
            .trim()
            .replace(/>\n\s*</g, "><"),
        };
      })(json.components.schemas);

      object.description = model.description;

      if (object.allOf) {
        object.example = model.example;
      } else if (object.items.$ref) {
        object.type = "object";

        object.example = [model.example];

        delete object.items;
      }

      return object;
    }

    object.description = ROW.MARK + getOption(ROW.OPTION);

    return object;
  }

  if (object.type === "object" || object.type === "array") {
    object.title = ROW.MARK;

    object.description = getOption(ROW.OPTION);

    return object;
  }

  object.description = ROW.MARK + getOption(ROW.OPTION);

  return object;
}

/**
 * Check whether parameters are required.
 * @param { string } MARK
 */
function getRequired(MARK) {
  return MARK.indexOf("*") > -1;
}

/**
 * Swagger Code creation.
 * @param { object } OBJ - https://www.npmjs.com/package/accp#obj
 * @param { object } json - https://swagger.io/specification/v2/?sbsearch=Basic%20Structure%20Swagger
 */
function setCode(OBJ, json) {
  json.components.schemas.Status.properties.message.description = Array.from(
    OBJ.CODE,
    (CODE) =>
      Array.from(
        CODE.CODE,
        (CODE) => `* ${CODE.CODE}: ${CODE.MARK.ko || CODE.MARK.en}`,
      ).join("\n"),
  ).join("\n");
}

/**
 * Swagger Path creation.
 * @param { object } OBJ - https://www.npmjs.com/package/accp#obj
 * @param { object } json - https://swagger.io/specification/v2/?sbsearch=Basic%20Structure%20Swagger
 */
function setPath(OBJ, json) {
  for (API of OBJ.API) {
    for (FUNC of API.FUNC) {
      if (!FUNC.COMP) continue;

      let opt = LIB.path.option(FUNC.OPT);

      var path = json.paths[getPath(API, FUNC)] || new Object();

      var object = {
        tags: [API.NAME.toLowerCase()],
        summary: `[${FUNC.CODE}] ${FUNC.DESC}${opt.token ? " 🔒" : ""}`,
        responses: LIB.path.response(FUNC.RES),
        description: LIB.path.description(OBJ, API, FUNC),
      };

      if (opt.token)
        object.security = [
          {
            token: [],
          },
        ];

      if (FUNC.GET || FUNC.DELETE) {
        object.parameters = LIB.path.parameters(FUNC.REQ, FUNC.PARAM);
      } else {
        /* Add path parameters for body methods */
        if (FUNC.PARAM && FUNC.PARAM.length > 0) {
          object.parameters = LIB.path.parameters(
            (FUNC.REQ || []).filter((ROW) => FUNC.PARAM.includes(ROW.NAME)),
            FUNC.PARAM,
          );
        }

        object.requestBody = LIB.path.body(FUNC.REQ, json, FUNC.PARAM);
      }

      path[getMethod(FUNC)] = setAttribute(object);

      json.paths[getPath(API, FUNC)] = path;
    }
  }
}

/**
 * Swagger schema (structure) creation.
 * @param { object } OBJ - https://www.npmjs.com/package/accp#obj
 * @param { object } json - https://swagger.io/specification/v2/?sbsearch=Basic%20Structure%20Swagger
 */
function setSchema(OBJ, json) {
  for (STRUCT of OBJ.STRUCT)
    json.components.schemas[STRUCT.NAME] = setAttribute(
      Object.assign(LIB.schema(STRUCT.DATA), {
        type: "object",
        title: `${STRUCT.NAME} ( ${STRUCT.MARK} )`,
      }),
    );
}

/**
 * https://www.npmjs.com/package/accp#obj
 * @param { object } OBJ
 * @param { object } GEN
 */
module.exports = function (OBJ, GEN) {
  var json = {
    openapi: "3.0.3",
    info: {
      title: "SWAGGER API",
      contact: {
        email: "hongdaesik88@gmail.com",
      },
      license: {
        url: "http://www.apache.org/licenses/LICENSE-2.0.html",
        name: "Apache 2.0",
      },
      version: "0.0.1",
    },
    servers: [
      {
        url: "http://localhost",
        description: "Dev",
      },
    ],
    paths: {},
    security: [
      {
        token: [],
      },
    ],
    components: {
      securitySchemes: {
        token: {
          in: "header",
          type: "apiKey",
          name: "X-API-TOKEN",
          description: `
Description: 사용자 토큰값\n\n
<details>
<summary>Development token</summary>
<p>Please enter the development token value.</p>
</details>`,
        },
      },
      schemas: {},
    },
  };

  setSchema(OBJ, json);

  setPath(OBJ, json);

  setCode(OBJ, json);

  var out = new GEN(PATH.join(BASE, "swagger.json"));

  out.open();

  out.print(JSON.stringify(json, null, 2));

  out.close();
};
