import * as Struct from '../pub/struct'

/** Description: function description */
export class GetTestByPath {

  /** @type { number } int variable */
  public param1?: number

  /** @type { Struct.Status | undefined } 상태 정보 */
  public status?: Struct.Status

  /**
   * @constructor
   * @param { any } data
   * @param { number } data.param1 int variable
   */
  constructor( data?: { param1?: number } ) {

    Struct.setAttribute( this, data )
  }
}
/** Description: function description */
export class PutTextByPath {

  /** @type { number } int variable */
  public param1?: number

  /** @type { Struct.Status | undefined } 상태 정보 */
  public status?: Struct.Status

  /**
   * @constructor
   * @param { any } data
   * @param { number } data.param1 int variable
   */
  constructor( data?: { param1?: number } ) {

    Struct.setAttribute( this, data )
  }
}

