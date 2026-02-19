/* require */

/* Virtual file for writing example code. */
const DB = require( '..' )
const FUNC = require( '..' )

const CODE = require( '../code/code' )

const QUERY = require( '../query/test_path' )

function Test_path () {}

/** 
 * Parameter: 
 * @param params.param1 int variable *
 */
Test_path.prototype.getTestByPath = async function( req ) {

/* Code for example, please edit it yourself. */
try {

  var connection = await DB.connection.write()

  let data = DB.query( connection, QUERY.get.any(), req.query || req.body )

  await connection.beginTransaction()

  await connection.commit()

  await connection.release()

  var response = FUNC.getStatus( req, CODE.SYSTEM_SUCCESS ) 

  /* int variable */
    response.param1 = DB.get( data, 0, 0 )

  return response

} catch ( error ) {

  if ( connection ) {

    await connection.rollback()

    await connection.release()
  }

  if ( error && error.message ) {

    console.error( new Date().locale(), error.message )

    return FUNC.getStatus( req, CODE.SYSTEM_DATABASE )
  }

  return FUNC.getStatus( req, error )
}
}


/** 
 * Parameter: 
 * @param params.param1 int variable *
 * @param body.param2 string variable *
 * @param body.param3 string variable
 */
Test_path.prototype.putTextByPath = async function( req ) {

/* Code for example, please edit it yourself. */
try {

  var connection = await DB.connection.write()

  let data = DB.query( connection, QUERY.put.any(), req.query || req.body )

  await connection.beginTransaction()

  await connection.commit()

  await connection.release()

  var response = FUNC.getStatus( req, CODE.SYSTEM_SUCCESS ) 

  /* int variable */
    response.param1 = DB.get( data, 0, 0 )

  return response

} catch ( error ) {

  if ( connection ) {

    await connection.rollback()

    await connection.release()
  }

  if ( error && error.message ) {

    console.error( new Date().locale(), error.message )

    return FUNC.getStatus( req, CODE.SYSTEM_DATABASE )
  }

  return FUNC.getStatus( req, error )
}
}


var test_path = new Test_path()

module.exports = test_path