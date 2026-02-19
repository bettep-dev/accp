const PATH = require("path");

const BASE = "out/angular";

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
          (ROW) => `- [${ROW.NAME}] ${ROW.MARK || ROW.CODE}`,
        ).join("\n" + getTab(5, 1));

      return "- nothing";
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
          (ROW) => `- ${ROW.NAME} ${ROW.MARK || ROW.CODE}`,
        ).join("\n" + getTab(5, 1));

      return "- nothing";
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

    /**
     * API Request parameter settings.
     * @param { object } REQ - https://www.npmjs.com/package/accp#obj
     * @returns
     */
    paramters: function (REQ, paths) {
      if (REQ)
        return Array.from(
          REQ.filter((ROW) => !paths || !paths.includes(ROW.NAME)),
          (ROW) => {
            if (ROW.ARRAY)
              return `.set( '${ROW.NAME}', encodeURIComponent( JSON.stringify( req?.${ROW.NAME} ) ) )`;

            switch (ROW.CLASS) {
              case "Int":
              case "Float":
              case "Double": {
                return `.set( '${ROW.NAME}', this.setReq( req?.${ROW.NAME} ) )`;
              }
              case "String": {
                return `.set( '${ROW.NAME}', this.setReq( req?.${ROW.NAME}, true ) )`;
              }
              case "Boolean": {
                return `.set( '${ROW.NAME}', this.setReq( req?.${ROW.NAME} ) )`;
              }
              default: {
                return `.set( '${ROW.NAME}', encodeURIComponent( JSON.stringify( req?.${ROW.NAME} ) ) )`;
              }
            }
          },
        ).join("\n" + getTab(2));

      return "";
    },
  },

  /**
   * Annotation output.
   * @param { object } DATA - Request, Response, Struct information(#https://www.npmjs.com/package/accp#obj).
   * @param { boolean } req - Whether or not it is a Request object.
   * @param { boolean } [clear=false] - Whether or not to annotate, output the specified annotation contents.
   * @returns
   */
  annotation: function (DATA, req, clear = false) {
    var param = new Array();

    if (!DATA) return "*";

    if (req)
      return param
        .concat(
          Array.from(
            DATA,
            (ROW) =>
              `* @param { ${getClass(ROW.CLASS, true)}${getArray(ROW.ARRAY)} } data.${ROW.NAME} ${ROW.MARK}`,
          ),
        )
        .join("\n" + getTab(3, 1));

    return (
      clear
        ? [
            "* @param { { data?: any, clear?: boolean, preloader?: boolean } } data",
            "* @param { any? } data.data 할당할 파라미터 객체",
            "* @param { boolean? } data.clear 초기화 여부",
            "* @param { boolean? } data.preloader 프리로더 여부",
          ]
        : ["* @param { any } data"]
    )
      .concat(
        Array.from(
          DATA,
          (ROW) =>
            `* @param { ${getClass(ROW.CLASS, true)}${getArray(ROW.ARRAY)} } data${clear ? ".data" : ""}.${ROW.NAME} ${ROW.MARK}`,
        ),
      )
      .join("\n" + getTab(3, 1));
  },

  /**
   * API Request Response initialization annotation.
   * @param { string } NAME - Object name.
   * @param { object } DATA - Request, Response, Struct information(#https://www.npmjs.com/package/accp#obj).
   * @param { boolean } struct - Whether to refer to a Struct object.
   * @returns
   */
  initialize: function (NAME, DATA, struct = false) {
    /**
     * Setting initial object declaration value.
     * @param { object } DATA
     * @param { boolean } struct - Whether to refer to a Struct object.
     * @returns
     */
    let value = function (DATA, struct = false) {
      if (DATA.ARRAY) return "[]";

      switch (DATA.CLASS) {
        case "Data": {
          return `new Object()`;
        }
        default: {
          return `new ${struct ? "Struct." : ""}${DATA.CLASS}()`;
        }
      }
    };

    if (DATA)
      return Array.from(DATA, (ROW) => {
        switch (ROW.CLASS) {
          case NAME:
          case "Int":
          case "Float":
          case "Double":
          case "Boolean": {
            return `/** @type { ${getClass(ROW.CLASS, struct)}${getArray(ROW.ARRAY)} } ${ROW.MARK} */\n${getTab(1)}public ${ROW.NAME}?: ${getClass(ROW.CLASS, struct)}${getArray(ROW.ARRAY)}`;
          }
          case "String": {
            return `/** @type { ${getClass(ROW.CLASS, struct)}${getArray(ROW.ARRAY)} } ${ROW.MARK} */\n${getTab(1)}public ${ROW.NAME}?: ${getClass(ROW.CLASS, struct)}${getArray(ROW.ARRAY)}${!ROW.ARRAY ? " = ''" : ""}`;
          }
          default: {
            return `/** @type { ${getClass(ROW.CLASS, struct)}${getArray(ROW.ARRAY)} } ${ROW.MARK} */\n${getTab(1)}public ${ROW.NAME}: ${getClass(ROW.CLASS, struct)}${getArray(ROW.ARRAY)} = ${value(ROW, struct)}`;
          }
        }
      }).join("\n" + getTab(1));

    return "";
  },

  /**
   * Constructor parameter output.
   * @param { object } DATA - Request, Response, Struct information(#https://www.npmjs.com/package/accp#obj).
   * @param { boolean } struct - Whether to refer to a Struct object.
   * @returns
   */
  constructor: function (DATA, struct = false) {
    if (DATA)
      return Array.from(
        DATA,
        (ROW) =>
          `${ROW.NAME}?: ${getClass(ROW.CLASS, struct)}${getArray(ROW.ARRAY)}`,
      ).join(", ");

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
 * Converting ACCP data type to Angular data type.
 * @param { object } name - Object class name.
 * @param { boolean } struct - Whether to refer to a Struct object.
 * @returns
 */
function getClass(name, struct = false) {
  switch (name) {
    case "Int":
    case "Float":
    case "Double": {
      return "number";
    }
    case "Data": {
      return "any";
    }
    case "String": {
      return name.toLowerCase();
    }
    case "Boolean": {
      return name.toLowerCase() + " | number";
    }
    default: {
      return (struct ? "Struct." : "") + name;
    }
  }
}

/**
 * Array or not.
 * @param { boolean } arr
 * @returns
 */
function getArray(arr) {
  return arr ? "[]" : "";
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
 * Create model file.
 */
function setModel(OBJ, GEN) {
  for (API of OBJ.API) {
    /* set api */
    var api = new GEN(PATH.join(BASE, "api", `${API.NAME.toLowerCase()}.ts`));

    api.open();

    api.print(
      `

import {
  map, 
  catchError,
  Observable, 
  ObservableInput
} from 'rxjs'

import { 
  Injectable 
} from '@angular/core'
import { 
  HttpClient, 
  HttpParams,
  HttpHeaders
} from '@angular/common/http'

import {
  ConfigService
} from 'src/app/service/config.service'
import {
  Modal,
  ModalService
} from 'src/app/service/modal.service'
import {
  PreloaderService
} from 'src/app/service/preloader.service'

import { 
  Config 
} from 'src/app/app.config'

import {
  environment
} from 'src/environments/environment'

/* import request */
import * as Req from '../req/${API.NAME.toLowerCase()}'

/* import response */
import * as Res from '../res/${API.NAME.toLowerCase()}'

@Injectable( {

  providedIn: 'root'
} )
export class ${getCapitalize(API.NAME)}Service {

  constructor(

    private http: HttpClient,

    private modalService: ModalService,
    private configService: ConfigService,
    private preloaderService: PreloaderService ) {}

  /**
   * Description: API 요청 결과 공용 콜백 설정
   */
  private error = ( error: any ): ObservableInput< any > => {
  
    this.preloaderService.stop()

    this.modalService.modal( new Modal( error ) )

    return error
  }

  private response = ( response: any ): void => {

    this.preloaderService.stop()

    return response
  }
  
  /**
   * Description: 요청 파라미터 확인
   * @param { any } param - 파라미터 
   * @param { boolean } [encode=false] - 인코드 여부
   */
  setReq( param: any, encode: boolean = false ): any {

    try {

      if ( 
      
        param == null || 
        param == 'null' || 
        param == undefined || 
        param == 'undefined' ) return ''

      return encode ? encodeURIComponent( param ) : param

    } catch {

      return ''
    }
  }
  ${Array.from(
    API.FUNC.filter((FUNC) => FUNC.COMP),
    (FUNC) => {
      var method = LIB.model.method(FUNC);

      var urlPath = method.PATH.replace(
        /:([a-zA-Z_][a-zA-Z0-9_]*)/g,
        "' + req?.$1 + '",
      );

      return `
  /** 
   * Description: ${FUNC.DESC} 
     - Code: ${FUNC.CODE}
     - Complete: ${FUNC.COMP.toString()}
   *
   * Process: 
     ${LIB.model.proc(FUNC.PROC)}
   *
   * Question:
     ${LIB.model.mark(FUNC.MARK)} */
  ${getCapitalize(FUNC.NAME, false, false)}( req?: Req.${FUNC.NAME} ): Observable< Res.${FUNC.NAME} > {

    if ( !req || req?.preloader?.animate ) this.preloaderService.start()

    let parameters: HttpParams = new HttpParams()

    ${LIB.model.paramters(FUNC.REQ, FUNC.PARAM)}

    return this.http.${method.NAME} < Res.${FUNC.NAME} > ( environment.api.concat( '/api/${API.BASE}/${urlPath}${method.QUERY ? "?' ).concat( parameters.toString() )" : "' ), parameters"}, { headers: this.configService.headers } ).pipe( map( this.response ), catchError( this.error ) )
  }`;
    },
  ).join("\n")}
}
`.replace(/^\n+/, ""),
    );

    api.close();

    /* set req */
    var req = new GEN(PATH.join(BASE, "req", `${API.NAME.toLowerCase()}.ts`));

    req.open();

    req.print(
      `

import * as Struct from '../pub/struct'

${Array.from(API.FUNC, (FUNC) =>
  `

/** Description: ${FUNC.DESC} */
export class ${FUNC.NAME} extends Struct.Preloader {

  ${LIB.initialize(FUNC.NAME, FUNC.REQ, true)}

  /**
   * @constructor
   ${LIB.annotation(FUNC.REQ, true)}
   */
  constructor( data?: { ${LIB.constructor(FUNC.REQ, true)} } ) {

    super()

    Struct.setAttribute( this, data )
  }

  /** 초기화 함수
   ${LIB.annotation(FUNC.REQ, false, true)}
   */
  onInit( data?: { clear?: boolean, data?: { ${LIB.constructor(FUNC.REQ, true)} }, preloader?: Struct.PreloaderInterface } ) {

    if ( data?.clear ) Struct.setClear( this )

    if ( data?.preloader ) this.preloader = data.preloader

    Struct.setAttribute( this, Struct.setClone( data?.data ) )

    return this
  }
}
`.replace(/^\n+/, ""),
).join("")}
`.replace(/^\n+/, ""),
    );

    req.close();

    /* set res */
    var res = new GEN(PATH.join(BASE, "res", `${API.NAME.toLowerCase()}.ts`));

    res.open();

    res.print(
      `

import * as Struct from '../pub/struct'

${Array.from(API.FUNC, (FUNC) =>
  `

/** Description: ${FUNC.DESC} */
export class ${FUNC.NAME} {

  ${LIB.initialize(FUNC.NAME, FUNC.RES, true)}

  /** @type { Struct.Status | undefined } 상태 정보 */
  public status?: Struct.Status

  /**
   * @constructor
   ${LIB.annotation(FUNC.RES, false)}
   */
  constructor( data?: { ${LIB.constructor(FUNC.RES, true)} } ) {

    Struct.setAttribute( this, data )
  }
}
`.replace(/^\n+/, ""),
).join("")}
`.replace(/^\n+/, ""),
    );

    res.close();
  }
}

/**
 * Create structure file.
 */
function setStruct(OBJ, GEN) {
  var out = new GEN(PATH.join(BASE, "pub", "struct.ts"));

  out.open();

  out.print(`
export function setClone( d: any ): any {

  return Object.assign( new Object(), d )
}

export function setClear( p: any ): any {

  for ( let k in p ) {
    
    if ( p[ k ] instanceof Object ) {

      p[ k ] = p[ k ] instanceof Array ? new Array() : new Object()

      continue
    }
    
    p[ k ] = undefined
  }

  return p
}

export function setAttribute( p: any, d: any ): any {

  for ( let k in d ) {
    
    if ( p[ k ] instanceof Object ) {

      if ( p[ k ] == undefined ) p[ k ] = d[ k ] instanceof Array ? new Array() : new Object()

      p[ k ] = setAttribute( p[ k ], d[ k ] )

      continue
    }

    if ( p[ k ] instanceof Array ) {

      p[ k ].push( d[ k ] )

      continue
    }

    p[ k ] = d[ k ] instanceof Array ? [ ...d[ k ] ] : d[ k ] instanceof Object ? { ...d[ k ] } : d[ k ]
  }

  return p
}

/** Description: 프리로더 설정 */
export class Preloader {

  public preloader: PreloaderInterface = {

    animate: true
  }
}

export interface PreloaderInterface {

  animate: boolean
}

${Array.from(OBJ.STRUCT, (STRUCT) =>
  `

/** Description: ${STRUCT.MARK} */
export class ${STRUCT.NAME} {

  [ key: string ]: any

  ${LIB.initialize(STRUCT.NAME, STRUCT.DATA)}

  /**
   * @constructor
   ${LIB.annotation(STRUCT.DATA, true)}
   */
  constructor( data? : { ${LIB.constructor(STRUCT.DATA)} } ) {

    setAttribute( this, data )
  }

  /** 초기화 함수
   ${LIB.annotation(STRUCT.DATA, false)}
   */
  onInit( data?: { ${LIB.constructor(STRUCT.DATA)} } ) {

    setAttribute( this, data )

    return this
  }
}
`.replace(/^\n+/, ""),
).join("\n")}
`);

  out.close();
}

/**
 * Generate code file.
 */
function setCode(OBJ, GEN) {
  var out = new GEN(PATH.join(BASE, "pub", "code.ts"));

  out.open();

  out.print(
    `

export class CODE {

  ${Array.from(OBJ.CODE, (CODE) => [`/* ${CODE.NAME} */`].concat(Array.from(CODE.CODE, (ROW) => `public static readonly ${CODE.NAME}_${ROW.NAME} = ${ROW.CODE}`)).join("\n" + getTab(1))).join("\n" + getTab(1))}
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
