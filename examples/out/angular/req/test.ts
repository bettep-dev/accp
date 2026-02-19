import * as Struct from '../pub/struct'

/** Description: function description */
export class GetTest extends Struct.Preloader {

  /** @type { number } int variable */
  public param1?: number
  /** @type { any } data variable */
  public param2: any = new Object()
  /** @type { number } float variable */
  public param3?: number
  /** @type { number } double variable */
  public param4?: number
  /** @type { string } string variable */
  public param5?: string = ''
  /** @type { boolean | number } boolean variable */
  public param6?: boolean | number
  /** @type { Struct.Parameter } struct variable */
  public param7: Struct.Parameter = new Struct.Parameter()
  /** @type { number } description of the value */
  public param8?: number

  /**
   * @constructor
   * @param { number } data.param1 int variable
   * @param { any } data.param2 data variable
   * @param { number } data.param3 float variable
   * @param { number } data.param4 double variable
   * @param { string } data.param5 string variable
   * @param { boolean | number } data.param6 boolean variable
   * @param { Struct.Parameter } data.param7 struct variable
   * @param { number } data.param8 description of the value
   */
  constructor( data?: { param1?: number, param2?: any, param3?: number, param4?: number, param5?: string, param6?: boolean | number, param7?: Struct.Parameter, param8?: number } ) {

    super()

    Struct.setAttribute( this, data )
  }

  /** 초기화 함수
   * @param { { data?: any, clear?: boolean, preloader?: boolean } } data
   * @param { any? } data.data 할당할 파라미터 객체
   * @param { boolean? } data.clear 초기화 여부
   * @param { boolean? } data.preloader 프리로더 여부
   * @param { number } data.data.param1 int variable
   * @param { any } data.data.param2 data variable
   * @param { number } data.data.param3 float variable
   * @param { number } data.data.param4 double variable
   * @param { string } data.data.param5 string variable
   * @param { boolean | number } data.data.param6 boolean variable
   * @param { Struct.Parameter } data.data.param7 struct variable
   * @param { number } data.data.param8 description of the value
   */
  onInit( data?: { clear?: boolean, data?: { param1?: number, param2?: any, param3?: number, param4?: number, param5?: string, param6?: boolean | number, param7?: Struct.Parameter, param8?: number }, preloader?: Struct.PreloaderInterface } ) {

    if ( data?.clear ) Struct.setClear( this )

    if ( data?.preloader ) this.preloader = data.preloader

    Struct.setAttribute( this, Struct.setClone( data?.data ) )

    return this
  }
}
/** Description: function description */
export class PostTest extends Struct.Preloader {

  /** @type { number } int variable */
  public param1?: number
  /** @type { any } data variable */
  public param2: any = new Object()
  /** @type { number } float variable */
  public param3?: number
  /** @type { number } double variable */
  public param4?: number
  /** @type { string } string variable */
  public param5?: string = ''
  /** @type { boolean | number } boolean variable */
  public param6?: boolean | number
  /** @type { Struct.Parameter } struct variable */
  public param7: Struct.Parameter = new Struct.Parameter()
  /** @type { number } description of the value */
  public param8?: number

  /**
   * @constructor
   * @param { number } data.param1 int variable
   * @param { any } data.param2 data variable
   * @param { number } data.param3 float variable
   * @param { number } data.param4 double variable
   * @param { string } data.param5 string variable
   * @param { boolean | number } data.param6 boolean variable
   * @param { Struct.Parameter } data.param7 struct variable
   * @param { number } data.param8 description of the value
   */
  constructor( data?: { param1?: number, param2?: any, param3?: number, param4?: number, param5?: string, param6?: boolean | number, param7?: Struct.Parameter, param8?: number } ) {

    super()

    Struct.setAttribute( this, data )
  }

  /** 초기화 함수
   * @param { { data?: any, clear?: boolean, preloader?: boolean } } data
   * @param { any? } data.data 할당할 파라미터 객체
   * @param { boolean? } data.clear 초기화 여부
   * @param { boolean? } data.preloader 프리로더 여부
   * @param { number } data.data.param1 int variable
   * @param { any } data.data.param2 data variable
   * @param { number } data.data.param3 float variable
   * @param { number } data.data.param4 double variable
   * @param { string } data.data.param5 string variable
   * @param { boolean | number } data.data.param6 boolean variable
   * @param { Struct.Parameter } data.data.param7 struct variable
   * @param { number } data.data.param8 description of the value
   */
  onInit( data?: { clear?: boolean, data?: { param1?: number, param2?: any, param3?: number, param4?: number, param5?: string, param6?: boolean | number, param7?: Struct.Parameter, param8?: number }, preloader?: Struct.PreloaderInterface } ) {

    if ( data?.clear ) Struct.setClear( this )

    if ( data?.preloader ) this.preloader = data.preloader

    Struct.setAttribute( this, Struct.setClone( data?.data ) )

    return this
  }
}

