/* dependency */
const ROUTER = require( 'express' ).Router()

/* Virtual file for writing example code. */
const FUNC = require( '..' )

const MODEL = require( '../model/test_path' )

/** 
 * Code: 200
 * Complete: true
 * Description: function description 
 * 
 * Process: 
 * * notihng
 *
 * Question:
 * * notihng */
ROUTER.get( '/test/:param1', /* Declare a function for parameter value existence and data restriction. */ function ( req, res, next ) {

  let response = FUNC.chkReq( req, {

    /* int variable * */
    param1: req.params.param1
  } )

  if ( response.status?.code ) return res.json( response )

  return next()

}, async function( req, res ) {

  console.log( new Date(), `Route.Get ${ req.baseUrl + req.path }` )

  return res.json( await MODEL.getTestByPath( req ) )
} )

/** 
 * Code: 201
 * Complete: true
 * Description: function description 
 * 
 * Process: 
 * * notihng
 *
 * Question:
 * * notihng */
ROUTER.put( '/test/:param1/:param1', /* Declare a function for parameter value existence and data restriction. */ function ( req, res, next ) {

  let response = FUNC.chkReq( req, {

    /* int variable * */
    param1: req.params.param1,
    /* string variable * */
    param2: req.body.param2
  } )

  if ( response.status?.code ) return res.json( response )

  return next()

}, async function( req, res ) {

  console.log( new Date(), `Route.Put ${ req.baseUrl + req.path }` )

  return res.json( await MODEL.putTextByPath( req ) )
} )


module.exports = ROUTER