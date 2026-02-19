import 'package:json_annotation/json_annotation.dart';

import 'package:flutter/pub/struct.dart';

part 'test.g.dart';

/// Description: function description
@JsonSerializable()
class GetTest {

  /// Status information *
  @JsonKey( name: 'status' ) Status? status;
  /// int variable
  @JsonKey( name: 'param1' ) int? param1;
  /// data variable
  @JsonKey( name: 'param2' ) dynamic param2;
  /// float variable
  @JsonKey( name: 'param3' ) double param3;
  /// double variable
  @JsonKey( name: 'param4' ) double? param4;
  /// string variable
  @JsonKey( name: 'param5' ) String? param5;
  /// boolean variable
  @JsonKey( name: 'param6' ) int? param6;
  /// struct variable
  @JsonKey( name: 'param7' ) Response? param7;
  /// description of the value
  @JsonKey( name: 'param8' ) int? param8;
  /// int array variable
  @JsonKey( name: 'param9' ) List< int >? param9;
  /// struct array variable
  @JsonKey( name: 'param10' ) List< Parameter >? param10;

  GetTest( { 

    this.status,
    this.param1,
    this.param2,
    this.param3,
    this.param4,
    this.param5,
    this.param6,
    this.param7,
    this.param8,
    this.param9,
    this.param10
   } );

  factory GetTest.fromJson( Map< String, dynamic > json ) => _$GetTestFromJson( json );

  Map< String, dynamic > toJson() => _$GetTestToJson( this );
}

/// Description: function description
@JsonSerializable()
class PostTest {

  /// Status information *
  @JsonKey( name: 'status' ) Status? status;
  /// int variable
  @JsonKey( name: 'param1' ) int? param1;
  /// data variable
  @JsonKey( name: 'param2' ) dynamic param2;
  /// float variable
  @JsonKey( name: 'param3' ) double param3;
  /// double variable
  @JsonKey( name: 'param4' ) double? param4;
  /// string variable
  @JsonKey( name: 'param5' ) String? param5;
  /// boolean variable
  @JsonKey( name: 'param6' ) int? param6;
  /// struct variable
  @JsonKey( name: 'param7' ) Response? param7;
  /// description of the value
  @JsonKey( name: 'param8' ) int? param8;
  /// int array variable
  @JsonKey( name: 'param9' ) List< int >? param9;
  /// struct array variable
  @JsonKey( name: 'param10' ) List< Parameter >? param10;

  PostTest( { 

    this.status,
    this.param1,
    this.param2,
    this.param3,
    this.param4,
    this.param5,
    this.param6,
    this.param7,
    this.param8,
    this.param9,
    this.param10
   } );

  factory PostTest.fromJson( Map< String, dynamic > json ) => _$PostTestFromJson( json );

  Map< String, dynamic > toJson() => _$PostTestToJson( this );
}

