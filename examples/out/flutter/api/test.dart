import 'dart:async';
import 'dart:developer';

import 'package:dio/dio.dart' as dio;

import 'package:flutter/res/test.dart' as res;

import 'package:flutter/pub/code.dart';
import 'package:flutter/pub/config.dart';
import 'package:flutter/pub/struct.dart' as struct;

class TestService {

  static final dio.Dio _dio = dio.Dio(); 

  TestService._(); 

  /// Desc: function description
  /// Code: 100
  /// Comp: true
  ///
  /// Process: 
  /// * [TEST.PostTest] 101
  ///
  /// Question:
  /// * param1 mark variable explain
  static Future< struct.Response > getTest( Map< String, String > headers, { dynamic req, bool useLog = false, dio.CancelToken? cancelToken } ) async {

    /// Debug request
    if ( useLog ) log( 'Request name: "get:GetTest", path: "/http://localhost:8080/test/test", req: "${ req?.toJson() }"' );

    return _dio.get( 'http://localhost:8080/test/test', queryParameters: req?.toJson(), options: dio.Options( headers: headers ), cancelToken: cancelToken ).timeout( const Duration( seconds: Config.timeoutPublic ), onTimeout: () {

      throw TimeoutException( null );

    } ).then( ( http ) {

      /// Debug response
      if ( useLog ) log( 'Response name: "get:GetTest", path: "/http://localhost:8080/test/test", res: "$http"' );

      if ( http.statusCode != Code.statusSuccess ) throw InvalidStatusCodeException( http.statusCode );

      struct.Response raw = struct.Response();

      raw.response = res.GetTest.fromJson( http.data );

      raw.status = raw.response?.status;

      return raw;
    } );
  }
  /// Desc: function description
  /// Code: 101
  /// Comp: true
  ///
  /// Process: 
  /// * nothing
  ///
  /// Question:
  /// * param1 mark variable explain
  static Future< struct.Response > postTest( Map< String, String > headers, { dynamic req, bool useLog = false, dio.CancelToken? cancelToken } ) async {

    /// Debug request
    if ( useLog ) log( 'Request name: "post:PostTest", path: "/http://localhost:8080/test/test", req: "${ req?.toJson() }"' );

    return _dio.post( 'http://localhost:8080/test/test', data: req?.toJson(), options: dio.Options( headers: headers ), cancelToken: cancelToken ).timeout( const Duration( seconds: Config.timeoutPublic ), onTimeout: () {

      throw TimeoutException( null );

    } ).then( ( http ) {

      /// Debug response
      if ( useLog ) log( 'Response name: "post:PostTest", path: "/http://localhost:8080/test/test", res: "$http"' );

      if ( http.statusCode != Code.statusSuccess ) throw InvalidStatusCodeException( http.statusCode );

      struct.Response raw = struct.Response();

      raw.response = res.PostTest.fromJson( http.data );

      raw.status = raw.response?.status;

      return raw;
    } );
  }
}