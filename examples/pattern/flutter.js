const PATH = require("path");

const BASE = "out/flutter";

const LIB = {
  model: {
    /**
     * Description of associated functions.
     * @param { object } PROC - https://www.npmjs.com/package/accp#obj
     * @returns
     */
    proc: function (PROC) {
      if (PROC)
        return Array.from(
          PROC,
          (ROW) => `/// * [${ROW.NAME}] ${ROW.MARK || ROW.CODE}`,
        ).join("\n" + getTab(1));

      return "/// * nothing";
    },

    /**
     * Parameter description.
     * @param { object } MARK - https://www.npmjs.com/package/accp#obj
     * @returns
     */
    mark: function (MARK) {
      if (MARK)
        return Array.from(
          MARK,
          (ROW) => `/// * ${ROW.NAME} ${ROW.MARK || ROW.CODE}`,
        ).join("\n" + getTab(1));

      return "/// * nothing";
    },

    /**
     * HTTP method information.
     * @param { object } FUNC - https://www.npmjs.com/package/accp#obj
     * @returns
     */
    method: function (FUNC) {
      let path = (p) => (p.indexOf("/") > 1 ? p : p.replace("/", ""));

      if (FUNC.GET) {
        return {
          PATH: path(FUNC.GET),
          NAME: "get",
          QUERY: true,
        };
      }

      if (FUNC.PUT) {
        return {
          PATH: path(FUNC.PUT),
          NAME: "put",
          QUERY: false,
        };
      }

      if (FUNC.POST) {
        return {
          PATH: path(FUNC.POST),
          NAME: "post",
          QUERY: false,
        };
      }

      if (FUNC.PATCH) {
        return {
          PATH: path(FUNC.PATCH),
          NAME: "patch",
          QUERY: false,
        };
      }

      return {
        PATH: path(FUNC.DELETE),
        NAME: "delete",
        QUERY: true,
      };
    },
  },

  /**
   * Constructor parameter output.
   * @param { object } DATA - Request, Response, Struct information(#https://www.npmjs.com/package/accp#obj).
   * @returns
   */
  constructor: function (DATA) {
    if (DATA)
      return ` { \n\n${getTab(2)}${Array.from(DATA, (ROW) => `this.${ROW.NAME}`).join(",\n" + getTab(2)) + "\n" + getTab(1)} } `;

    return "";
  },

  /**
   * API Request Response initialization annotation.
   * @param { object } DATA - Request, Response, Struct information(#https://www.npmjs.com/package/accp#obj).
   * @returns
   */
  initialize: function (DATA) {
    /**
     * ACCP data type changed to Flutter format.
     * @param { object } DATA
     * @returns
     */
    let getClass = function (DATA) {
      switch (DATA.CLASS) {
        case "Int":
        case "Double": {
          switch (DATA.NAME) {
            case "typeContact": {
              return DATA.ARRAY ? `List< num >?` : `num?`;
            }
          }

          return DATA.ARRAY
            ? `List< ${DATA.CLASS.toLowerCase()} >?`
            : `${DATA.CLASS.toLowerCase()}?`;
        }
        case "Data": {
          return DATA.ARRAY ? "List< dynamic >?" : "dynamic";
        }
        case "Float": {
          return DATA.ARRAY ? "List< double >?" : "double";
        }
        case "Boolean": {
          return DATA.ARRAY ? "List< int >?" : "int?";
        }
        default: {
          return DATA.ARRAY ? `List< ${DATA.CLASS} >?` : `${DATA.CLASS}?`;
        }
      }
    };

    if (DATA)
      return Array.from(
        DATA,
        (ROW) =>
          `/// ${ROW.MARK}\n  @JsonKey( name: '${ROW.NAME}' ) ${getClass(ROW)} ${ROW.NAME};`,
      ).join("\n" + getTab(1));

    return "";
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
 * Create structure.
 */
function setStruct(OBJ, GEN) {
  var out = new GEN(PATH.join(BASE, "pub", "struct.dart"));

  out.open();

  out.print(
    `

import 'package:json_annotation/json_annotation.dart';

part 'struct.g.dart';

${Array.from(OBJ.STRUCT, (STRUCT) =>
  `

/// Description: ${STRUCT.MARK}
@JsonSerializable()
class ${STRUCT.NAME} {

  ${LIB.initialize(STRUCT.DATA)}

  ${STRUCT.NAME}(${LIB.constructor(STRUCT.DATA)});

  factory ${STRUCT.NAME}.fromJson( Map< String, dynamic > json ) => _$${STRUCT.NAME}FromJson( json );

  Map< String, dynamic > toJson() => _$${STRUCT.NAME}ToJson( this );
}
`.replace(/^\n+/, ""),
).join("\n")}
`.replace(/^\n+/, ""),
  );

  out.close();
}

/**
 * Create model file.
 */
function setModel(OBJ, GEN) {
  var config = new GEN(PATH.join(BASE, "pub", "config.dart"));

  config.open();

  config.print(
    `

class Config {

  static const timeoutPublic = 20;
  static const timeoutMultipart = 600;
}

class InvalidStatusCodeException implements Exception {

  final int? statusCode;

  InvalidStatusCodeException( this.statusCode );

  @override
  String toString() {

    return "InvalidStatusCodeException. status code : $statusCode";
  }
}
`.replace(/^\n+/, ""),
  );

  config.close();

  for (API of OBJ.API) {
    /* set api */
    var api = new GEN(PATH.join(BASE, "api", `${API.NAME.toLowerCase()}.dart`));

    api.open();

    api.print(
      `

import 'dart:async';
import 'dart:developer';

import 'package:dio/dio.dart' as dio;

import 'package:flutter/res/${API.NAME.toLowerCase()}.dart' as res;

import 'package:flutter/pub/code.dart';
import 'package:flutter/pub/config.dart';
import 'package:flutter/pub/struct.dart' as struct;

class ${getCapitalize(API.NAME)}Service {

  static final dio.Dio _dio = dio.Dio(); 

  ${getCapitalize(API.NAME)}Service._(); 

${Array.from(
  API.FUNC.filter((FUNC) => FUNC.COMP),
  (FUNC) => {
    var method = LIB.model.method(FUNC);

    let multipart =
      FUNC.OPT?.find((OPT) => OPT.NAME.indexOf("multipart") > -1) || false;

    let urlPath = method.PATH.replace(
      /:([a-zA-Z_][a-zA-Z0-9_]*)/g,
      "${ req?.$1 }",
    );

    return `

  /// Desc: ${FUNC.DESC}
  /// Code: ${FUNC.CODE}
  /// Comp: ${FUNC.COMP.toString()}
  ///
  /// Process: 
  ${LIB.model.proc(FUNC.PROC)}
  ///
  /// Question:
  ${LIB.model.mark(FUNC.MARK)}
  static Future< struct.Response > ${getCapitalize(FUNC.NAME, false, false)}( Map< String, String > headers, { dynamic req, bool useLog = false, dio.CancelToken? cancelToken } ) async {

    /// Debug request
    if ( useLog ) log( 'Request name: "${method.NAME}:${FUNC.NAME}", path: "/${API.BASE}/${urlPath}", req: "\${ req?.toJson() }"' );

    return _dio.${method.NAME}( '${API.BASE}/${urlPath}', ${method.QUERY ? "queryParameters: req?.toJson()" : "data: req?.toJson()"}, options: dio.Options( headers: headers ), cancelToken: cancelToken ).timeout( const Duration( seconds: ${multipart ? "Config.timeoutMultipart" : "Config.timeoutPublic"} ), onTimeout: () {

      throw TimeoutException( null );

    } ).then( ( http ) {

      /// Debug response
      if ( useLog ) log( 'Response name: "${method.NAME}:${FUNC.NAME}", path: "/${API.BASE}/${urlPath}", res: "\$http"' );

      if ( http.statusCode != Code.statusSuccess ) throw InvalidStatusCodeException( http.statusCode );

      struct.Response raw = struct.Response();

      raw.response = res.${FUNC.NAME}.fromJson( http.data );

      raw.status = raw.response?.status;

      return raw;
    } );
  }`.replace(/^\n+/, "");
  },
).join("\n")}
}`.replace(/^\n+/, ""),
    );

    api.close();

    /* set req */
    var req = new GEN(PATH.join(BASE, "req", `${API.NAME.toLowerCase()}.dart`));

    req.open();

    req.print(
      `

import 'package:json_annotation/json_annotation.dart';

import 'package:flutter/pub/struct.dart';

part '${API.NAME.toLowerCase()}.g.dart';

${Array.from(
  API.FUNC.filter((FUNC) => FUNC.COMP),
  (FUNC) =>
    `

/// Description: ${FUNC.DESC}
@JsonSerializable()
class ${FUNC.NAME} {

  ${LIB.initialize(FUNC.REQ, true)}

  ${FUNC.NAME}(${LIB.constructor(FUNC.REQ)});

  factory ${FUNC.NAME}.fromJson( Map< String, dynamic > json ) => _$${FUNC.NAME}FromJson( json );

  Map< String, dynamic > toJson() => _$${FUNC.NAME}ToJson( this );
}
`.replace(/^\n+/, ""),
).join("\n")}
`.replace(/^\n+/, ""),
    );

    req.close();

    /* set res */
    var res = new GEN(PATH.join(BASE, "res", `${API.NAME.toLowerCase()}.dart`));

    res.open();

    res.print(
      `

import 'package:json_annotation/json_annotation.dart';

import 'package:flutter/pub/struct.dart';

part '${API.NAME.toLowerCase()}.g.dart';

${Array.from(
  API.FUNC.filter((FUNC) => FUNC.COMP),
  (FUNC) => {
    /* Initialization for assigning a default response object. */
    if (!FUNC.RES) FUNC.RES = [];

    /* Set the default response object (this is a public object for example purposes). */
    FUNC.RES.unshift({
      NAME: "status",
      MARK: "Status information *",
      CLASS: "Status",
    });

    return `

/// Description: ${FUNC.DESC}
@JsonSerializable()
class ${FUNC.NAME} {

  ${LIB.initialize(FUNC.RES, true)}

  ${FUNC.NAME}(${LIB.constructor(FUNC.RES)});

  factory ${FUNC.NAME}.fromJson( Map< String, dynamic > json ) => _$${FUNC.NAME}FromJson( json );

  Map< String, dynamic > toJson() => _$${FUNC.NAME}ToJson( this );
}
`.replace(/^\n+/, "");
  },
).join("\n")}
`.replace(/^\n+/, ""),
    );

    res.close();
  }
}

/**
 * Generate code file.
 */
function setCode(OBJ, GEN) {
  var out = new GEN(PATH.join(BASE, "pub", "code.ts"));

  out.open();

  out.print(
    `

class Code {

  ${Array.from(OBJ.CODE, (CODE) => [`/* ${CODE.NAME} */`].concat(Array.from(CODE.CODE, (ROW) => `public static readonly ${CODE.NAME}_${ROW.NAME} = ${ROW.CODE};`)).join("\n" + getTab(1))).join("\n" + getTab(1))}
}
`.replace(/^\n+/, ""),
  );

  out.close();
}

module.exports = function (OBJ, GEN) {
  setStruct(OBJ, GEN);

  setModel(OBJ, GEN);

  setCode(OBJ, GEN);
};
