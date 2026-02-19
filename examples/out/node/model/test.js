/* require */

/* Virtual file for writing example code. */
const DB = require( '..' )
const FUNC = require( '..' )

const CODE = require( '../code/code' )

const QUERY = require( '../query/test' )

function Test () {}

/** 
 * Parameter: 
 * @param query.param1 int variable
 * @param query.param2 data variable
 * @param query.param3 float variable
 * @param query.param4 double variable
 * @param query.param5 string variable
 * @param query.param6 boolean variable
 * @param query.param7 struct variable
 * @param query.param8 description of the value
 */
Test.prototype.getTest = async function( req ) {

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

    /* data variable */
    response.param2 = DB.get( data, 1, 0 )

    /* float variable */
    response.param3 = DB.get( data, 2, 0 )

    /* double variable */
    response.param4 = DB.get( data, 3, 0 )

    /* string variable */
    response.param5 = DB.get( data, 4, 0 )

    /* boolean variable */
    response.param6 = DB.get( data, 5, 0 )

    /* struct variable */
    response.param7 = DB.get( data, 6, 0 )

    /* description of the value */
    response.param8 = DB.get( data, 7, 0 )

    /* int array variable */
    response.param9 = DB.get( data, 8 )

    /* struct array variable */
    response.param10 = DB.get( data, 9 )

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
 * @param body.param1 int variable
 * @param body.param2 data variable
 * @param body.param3 float variable
 * @param body.param4 double variable
 * @param body.param5 string variable
 * @param body.param6 boolean variable
 * @param body.param7 struct variable
 * @param body.param8 description of the value
 */
Test.prototype.postTest = async function( req ) {

/* Code for example, please edit it yourself. */
try {

  var connection = await DB.connection.write()

  let data = DB.query( connection, QUERY.set.any(), req.query || req.body )

  await connection.beginTransaction()

  await connection.commit()

  await connection.release()

  var response = FUNC.getStatus( req, CODE.SYSTEM_SUCCESS ) 

  /* int variable */
    response.param1 = DB.get( data, 0, 0 )

    /* data variable */
    response.param2 = DB.get( data, 1, 0 )

    /* float variable */
    response.param3 = DB.get( data, 2, 0 )

    /* double variable */
    response.param4 = DB.get( data, 3, 0 )

    /* string variable */
    response.param5 = DB.get( data, 4, 0 )

    /* boolean variable */
    response.param6 = DB.get( data, 5, 0 )

    /* struct variable */
    response.param7 = DB.get( data, 6, 0 )

    /* description of the value */
    response.param8 = DB.get( data, 7, 0 )

    /* int array variable */
    response.param9 = DB.get( data, 8 )

    /* struct array variable */
    response.param10 = DB.get( data, 9 )

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


var test = new Test()

module.exports = test