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
import * as Req from '../req/test'

/* import response */
import * as Res from '../res/test'

@Injectable( {

  providedIn: 'root'
} )
export class TestService {

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
  
  /** 
   * Description: function description 
     - Code: 100
     - Complete: true
   *
   * Process: 
     - [TEST.PostTest] 101
   *
   * Question:
     - param1 mark variable explain */
  getTest( req?: Req.GetTest ): Observable< Res.GetTest > {

    if ( !req || req?.preloader?.animate ) this.preloaderService.start()

    let parameters: HttpParams = new HttpParams()

    .set( 'param1', this.setReq( req?.param1 ) )
    .set( 'param2', encodeURIComponent( JSON.stringify( req?.param2 ) ) )
    .set( 'param3', this.setReq( req?.param3 ) )
    .set( 'param4', this.setReq( req?.param4 ) )
    .set( 'param5', this.setReq( req?.param5, true ) )
    .set( 'param6', this.setReq( req?.param6 ) )
    .set( 'param7', encodeURIComponent( JSON.stringify( req?.param7 ) ) )
    .set( 'param8', this.setReq( req?.param8 ) )

    return this.http.get < Res.GetTest > ( environment.api.concat( '/api/http://localhost:8080/test/test?' ).concat( parameters.toString() ), { headers: this.configService.headers } ).pipe( map( this.response ), catchError( this.error ) )
  }

  /** 
   * Description: function description 
     - Code: 101
     - Complete: true
   *
   * Process: 
     - nothing
   *
   * Question:
     - param1 mark variable explain */
  postTest( req?: Req.PostTest ): Observable< Res.PostTest > {

    if ( !req || req?.preloader?.animate ) this.preloaderService.start()

    let parameters: HttpParams = new HttpParams()

    .set( 'param1', this.setReq( req?.param1 ) )
    .set( 'param2', encodeURIComponent( JSON.stringify( req?.param2 ) ) )
    .set( 'param3', this.setReq( req?.param3 ) )
    .set( 'param4', this.setReq( req?.param4 ) )
    .set( 'param5', this.setReq( req?.param5, true ) )
    .set( 'param6', this.setReq( req?.param6 ) )
    .set( 'param7', encodeURIComponent( JSON.stringify( req?.param7 ) ) )
    .set( 'param8', this.setReq( req?.param8 ) )

    return this.http.post < Res.PostTest > ( environment.api.concat( '/api/http://localhost:8080/test/test' ), parameters, { headers: this.configService.headers } ).pipe( map( this.response ), catchError( this.error ) )
  }
}
