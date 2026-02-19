![](https://cdn.bettep.org/accp/icon.512x256.webp)

## Auto Create Code with Pattern files

Built to automatically create API codes or documents using concise code. You can change the code to what you want by using the pattern.

<br>

<br>

## Installation

```bash
npm install accp -g
```

<br>

<br>

## Visual Code Extension

[Visual Code Extension Program accp language](https://marketplace.visualstudio.com/items?itemName=Bettep.accp)

Open the file with the extension( `.api`, `.code`, `.struct` ).

Enter the `ctrl` + `k` `m` (change language mode ) command.

Select `Accp` and apply it.

<br><br>

## Example

```bash
accp --examples <folder>
```

An example file is created within the `<folder>`. Example project used a Swift pattern.

The folder structure is as follows.

<br>

`api` : Default document defining API( [.api](#api) ).

`code` : Error Code Definition and Translation( [.code](#code) ).

`struct` : Structure used in API( [.struct](#struct) ).

`pattern` : Custom pattern files( `.js` ).

**\* All files and folders are required.**

<br><br>

## Compile

```bash
accp --compile
```

Compile progresses with reference to pattern file. Compilation results are returned to [OBJ](#obj) and [GEN](#gen).

<br>

```javascript
module.exports = function (OBJ, GEN) {
  /* Please write your code */
};
```

The following code shall be included in the `pattern/*.js` file.

<br>

![Compile result](https://cdn.bettep.org/accp/1.webp)

<br><br>

## Return value

#### GEN

GEN is a function that helps you create files.

<br>

##### initialization

```javascript
var api = new GEN("file path");
```

<br>

##### method

`api.open( encoding )` : Create write stream, default encoding `utf8`.

`api.print( string )` : Write the content.

`api.close()` : Close write stream.

<br><br>

#### OBJ

Object created through `accp --compile`.

```javascript
OBJ = {

  API: [ ( CLASS ) {

      BASE: String,
      NAME: String,
      MARK: String,
      FUNC: [ ( FUNC ) {

          CODE: Int,
          NAME: String,
          DESC: String

          /* Request method: address */
          ( GET | PUT | POST | PATCH | DELETE ): String

          /* Path parameters extracted from request address */
          PARAM: [ String, ... ]

          /* Completion status */
          COMP: ( true | false )

          /* Associative process */
          PROC: [ {

              CODE: Int ( CLASS.FUNC.CODE ),
              NAME: String ( CLASS.FUNC.NAME )
          }, ... ],

          /* Comments about this function */
          MARK: [ {

              NAME: String,
              MARK: String
          }, ... ],

          REQ: [ ( DATA ) {

              NAME: String,
              MARK: String,
              CLASS: String,
              ARRAY: ( true | false ),
              OPTION: {

                  key: String,
                  key: String, ...
              }
          }, ... ],

          /* Be the same as REQ */
          RES: [ { ... } ],

          /* User defined value */
          OPT: {

              key: ( true | false ),
              key: ( true | false ), ...
          }
      }, ... ]
  }, ... ],

  CODE: [ ( CLASS ) {

      NAME: String,
      MARK: String,
      CODE: [ {

          CODE: Int,
          NAME: String,
          MARK: {

              key: String,
              key: String, ...
          }
      } ],
  }, ... ],

  STRUCT: [ {

      NAME: String,
      MARK: String,

      /* Be the same as REQ.DATA */
      DATA: [ { ... } ]
  }, ... ]
}
```

<br><br>

## Language

accp language is provided as a [visual code extension program](https://marketplace.visualstudio.com/items?itemName=Bettep.accp).

<br>

#### .api

![](https://cdn.bettep.org/accp/2.webp)

###### Usage prefix

`API` : Snippet for api.

<br>

#### .code

![](https://cdn.bettep.org/accp/3.webp)

###### Usage prefix

`CODE` : Snippet for code.

<br>

#### .struct

![](https://cdn.bettep.org/accp/4.webp)

###### Usage prefix

`STRUCT` : Snippet for struct.

<br><br>

## Raw data provided

`Int`

`Data`

`Float`

`Double`

`String`

`Boolean`

<br><br>

## Change Log

`1.0.4-beta` : Replace sample files.

`1.0.5-beta` : Usage prefix explain add.

`1.0.6-beta` : Homepage domain change.

`1.0.7-beta` : Change to compile based on each api file.

`1.0.8-beta` : Solving a problem in which request partial detail information is truncated to spacing.

`1.0.9-beta` : Fixed an issue where the COMP value was unconditionally true.

`1.2.1-beta` : Addition of the PUT, PATCH, DELETE request method ( Consequently, it supports GET | PUT | POST | PATCH | DELETE ).

`1.2.2-beta` : Fixed a bug that would not output if 'import' was used in the variable name.

`1.2.3-beta` : Add sample pattern file (Flutter, Node JS).

`1.3.0-beta` : Modified main library & example pattern code. / Added Angular example pattern file. / When creating a file with `new Gen(path)`, if there is no path corresponding to path, a folder is created.

`1.3.3` : Modified Angular & NodeJS sample file and fixed issue with false value not being applied to OPT parameter.

`1.4.3` : Enhanced data validation features, more reliable error log output.

`1.4.4` : Add path parameter support with REQ block validation and syntax highlighting (e.g., :id in GET user/:id).

<br><br>

## License

MIT

<br><br>

## Other programs

<https://bettep.org>
