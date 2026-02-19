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
import * as Req from '../req/test_path'

/* import response */
import * as Res from '../res/test_path'

@Injectable( {

  providedIn: 'root'
} )
export class Test_pathService {

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
     - Code: 200
     - Complete: true
   *
   * Process: 
     - nothing
   *
   * Question:
     - nothing */
  getTestByPath( req?: Req.GetTestByPath ): Observable< Res.GetTestByPath > {

    if ( !req || req?.preloader?.animate ) this.preloaderService.start()

    let parameters: HttpParams = new HttpParams()

    

    return this.http.get < Res.GetTestByPath > ( environment.api.concat( '/api/http://localhost:8080/test_path/test/' + req?.param1 + '?' ).concat( parameters.toString() ), { headers: this.configService.headers } ).pipe( map( this.response ), catchError( this.error ) )
  }

  /** 
   * Description: function description 
     - Code: 201
     - Complete: true
   *
   * Process: 
     - nothing
   *
   * Question:
     - nothing */
  putTextByPath( req?: Req.PutTextByPath ): Observable< Res.PutTextByPath > {

    if ( !req || req?.preloader?.animate ) this.preloaderService.start()

    let parameters: HttpParams = new HttpParams()

    .set( 'param2', this.setReq( req?.param2, true ) )
    .set( 'param3', this.setReq( req?.param3, true ) )

    return this.http.put < Res.PutTextByPath > ( environment.api.concat( '/api/http://localhost:8080/test_path/test/' + req?.param1 + '/' + req?.param1 + '' ), parameters, { headers: this.configService.headers } ).pipe( map( this.response ), catchError( this.error ) )
  }
}
