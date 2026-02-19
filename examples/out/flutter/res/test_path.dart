import 'package:json_annotation/json_annotation.dart';

import 'package:flutter/pub/struct.dart';

part 'test_path.g.dart';

/// Description: function description
@JsonSerializable()
class GetTestByPath {

  /// Status information *
  @JsonKey( name: 'status' ) Status? status;
  /// int variable
  @JsonKey( name: 'param1' ) int? param1;

  GetTestByPath( { 

    this.status,
    this.param1
   } );

  factory GetTestByPath.fromJson( Map< String, dynamic > json ) => _$GetTestByPathFromJson( json );

  Map< String, dynamic > toJson() => _$GetTestByPathToJson( this );
}

/// Description: function description
@JsonSerializable()
class PutTextByPath {

  /// Status information *
  @JsonKey( name: 'status' ) Status? status;
  /// int variable
  @JsonKey( name: 'param1' ) int? param1;

  PutTextByPath( { 

    this.status,
    this.param1
   } );

  factory PutTextByPath.fromJson( Map< String, dynamic > json ) => _$PutTextByPathFromJson( json );

  Map< String, dynamic > toJson() => _$PutTextByPathToJson( this );
}

