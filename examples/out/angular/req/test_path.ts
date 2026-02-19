import * as Struct from '../pub/struct'

/** Description: function description */
export class GetTestByPath extends Struct.Preloader {

  /** @type { number } int variable * */
  public param1?: number

  /**
   * @constructor
   * @param { number } data.param1 int variable *
   */
  constructor( data?: { param1?: number } ) {

    super()

    Struct.setAttribute( this, data )
  }

  /** 초기화 함수
   * @param { { data?: any, clear?: boolean, preloader?: boolean } } data
   * @param { any? } data.data 할당할 파라미터 객체
   * @param { boolean? } data.clear 초기화 여부
   * @param { boolean? } data.preloader 프리로더 여부
   * @param { number } data.data.param1 int variable *
   */
  onInit( data?: { clear?: boolean, data?: { param1?: number }, preloader?: Struct.PreloaderInterface } ) {

    if ( data?.clear ) Struct.setClear( this )

    if ( data?.preloader ) this.preloader = data.preloader

    Struct.setAttribute( this, Struct.setClone( data?.data ) )

    return this
  }
}
/** Description: function description */
export class PutTextByPath extends Struct.Preloader {

  /** @type { number } int variable * */
  public param1?: number
  /** @type { string } string variable * */
  public param2?: string = ''
  /** @type { string } string variable */
  public param3?: string = ''

  /**
   * @constructor
   * @param { number } data.param1 int variable *
   * @param { string } data.param2 string variable *
   * @param { string } data.param3 string variable
   */
  constructor( data?: { param1?: number, param2?: string, param3?: string } ) {

    super()

    Struct.setAttribute( this, data )
  }

  /** 초기화 함수
   * @param { { data?: any, clear?: boolean, preloader?: boolean } } data
   * @param { any? } data.data 할당할 파라미터 객체
   * @param { boolean? } data.clear 초기화 여부
   * @param { boolean? } data.preloader 프리로더 여부
   * @param { number } data.data.param1 int variable *
   * @param { string } data.data.param2 string variable *
   * @param { string } data.data.param3 string variable
   */
  onInit( data?: { clear?: boolean, data?: { param1?: number, param2?: string, param3?: string }, preloader?: Struct.PreloaderInterface } ) {

    if ( data?.clear ) Struct.setClear( this )

    if ( data?.preloader ) this.preloader = data.preloader

    Struct.setAttribute( this, Struct.setClone( data?.data ) )

    return this
  }
}

