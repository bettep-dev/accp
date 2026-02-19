import 'package:json_annotation/json_annotation.dart';

import 'package:flutter/pub/struct.dart';

part 'test_path.g.dart';

/// Description: function description
@JsonSerializable()
class GetTestByPath {

  /// int variable *
  @JsonKey( name: 'param1' ) int? param1;

  GetTestByPath( { 

    this.param1
   } );

  factory GetTestByPath.fromJson( Map< String, dynamic > json ) => _$GetTestByPathFromJson( json );

  Map< String, dynamic > toJson() => _$GetTestByPathToJson( this );
}

/// Description: function description
@JsonSerializable()
class PutTextByPath {

  /// int variable *
  @JsonKey( name: 'param1' ) int? param1;
  /// string variable *
  @JsonKey( name: 'param2' ) String? param2;
  /// string variable
  @JsonKey( name: 'param3' ) String? param3;

  PutTextByPath( { 

    this.param1,
    this.param2,
    this.param3
   } );

  factory PutTextByPath.fromJson( Map< String, dynamic > json ) => _$PutTextByPathFromJson( json );

  Map< String, dynamic > toJson() => _$PutTextByPathToJson( this );
}

