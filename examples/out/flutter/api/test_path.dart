import 'dart:async';
import 'dart:developer';

import 'package:dio/dio.dart' as dio;

import 'package:flutter/res/test_path.dart' as res;

import 'package:flutter/pub/code.dart';
import 'package:flutter/pub/config.dart';
import 'package:flutter/pub/struct.dart' as struct;

class Test_pathService {

  static final dio.Dio _dio = dio.Dio(); 

  Test_pathService._(); 

  /// Desc: function description
  /// Code: 200
  /// Comp: true
  ///
  /// Process: 
  /// * nothing
  ///
  /// Question:
  /// * nothing
  static Future< struct.Response > getTestByPath( Map< String, String > headers, { dynamic req, bool useLog = false, dio.CancelToken? cancelToken } ) async {

    /// Debug request
    if ( useLog ) log( 'Request name: "get:GetTestByPath", path: "/http://localhost:8080/test_path/test/${ req?.param1 }", req: "${ req?.toJson() }"' );

    return _dio.get( 'http://localhost:8080/test_path/test/${ req?.param1 }', queryParameters: req?.toJson(), options: dio.Options( headers: headers ), cancelToken: cancelToken ).timeout( const Duration( seconds: Config.timeoutPublic ), onTimeout: () {

      throw TimeoutException( null );

    } ).then( ( http ) {

      /// Debug response
      if ( useLog ) log( 'Response name: "get:GetTestByPath", path: "/http://localhost:8080/test_path/test/${ req?.param1 }", res: "$http"' );

      if ( http.statusCode != Code.statusSuccess ) throw InvalidStatusCodeException( http.statusCode );

      struct.Response raw = struct.Response();

      raw.response = res.GetTestByPath.fromJson( http.data );

      raw.status = raw.response?.status;

      return raw;
    } );
  }
  /// Desc: function description
  /// Code: 201
  /// Comp: true
  ///
  /// Process: 
  /// * nothing
  ///
  /// Question:
  /// * nothing
  static Future< struct.Response > putTextByPath( Map< String, String > headers, { dynamic req, bool useLog = false, dio.CancelToken? cancelToken } ) async {

    /// Debug request
    if ( useLog ) log( 'Request name: "put:PutTextByPath", path: "/http://localhost:8080/test_path/test/${ req?.param1 }/${ req?.param1 }", req: "${ req?.toJson() }"' );

    return _dio.put( 'http://localhost:8080/test_path/test/${ req?.param1 }/${ req?.param1 }', data: req?.toJson(), options: dio.Options( headers: headers ), cancelToken: cancelToken ).timeout( const Duration( seconds: Config.timeoutPublic ), onTimeout: () {

      throw TimeoutException( null );

    } ).then( ( http ) {

      /// Debug response
      if ( useLog ) log( 'Response name: "put:PutTextByPath", path: "/http://localhost:8080/test_path/test/${ req?.param1 }/${ req?.param1 }", res: "$http"' );

      if ( http.statusCode != Code.statusSuccess ) throw InvalidStatusCodeException( http.statusCode );

      struct.Response raw = struct.Response();

      raw.response = res.PutTextByPath.fromJson( http.data );

      raw.status = raw.response?.status;

      return raw;
    } );
  }
}