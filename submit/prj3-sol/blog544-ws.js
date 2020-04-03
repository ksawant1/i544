import assert from 'assert';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import querystring from 'querystring';
import Blog544 from "./blog544.js";
import Data from "./data.js"
import BlogError from './blog-error.js';
//import {remove} from "mongodb";


const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

export default function serve(port, meta, model) {
  const app = express();
  const hateoasLinker = require('express-hateoas-links');
  app.locals.port = port;
  app.locals.meta = meta;
  app.locals.model = model;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

function setupRoutes(app) {
  const model = app.locals.model;
  const meta = app.locals.meta;
  app.use(cors());
  app.use(bodyParser.json());
  //@TODO
  app.get('/meta', doList(app));   //A GET handler for meta-information.
  //app.get('/:type', doListCategory(app)); //A GET handler for paging through objects of a particular category.
  app.get('/:type/:id', doGet(app)); //A GET handler for returning a specific blog object in a particular category.
  app.delete(`/:type/:id`, doDelete(app));  //A DELETE handler for deleting a specific blog object in a particular category.
  app.patch(`/:type/:id`, doUpdate(app)); //A PATCH handler for updating a specific blog object in a particular category.
app.post(`/:type`,doCreate(app)); //A POST handler for creating a new object in a particular category.
}

/****************************** Handlers *******************************/

//@TODO
function doList(app) {
  return errorWrap(function(req, res) {

    try {
      res.json(app.locals.meta, { rel: "self", href: "http://localhost:2345/meta", name: "self" });
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

/*function doList(app) {
  return errorWrap(async function(req, res) {
    const q = req.query || {};
    try {
      const results = await app.locals.model.read(q);
      res.json(results);
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}*/
function doGet(app) {
  return errorWrap(async function(req, res) {
    try {

      const id = req.params.id;
      const category=req.params.type;
      const results = await app.locals.model.find(category,{id:id});
      await res.json(results);
      }

    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }

})}
function doDelete(app) {
  return errorWrap(async function(req, res) {
    try {
      const id = req.params.id;
      const category=req.params.type;
     const results = await app.locals.model.remove(category,{id:id});
      res.send(OK);

    }
    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}
function doUpdate(app) {
  return errorWrap(async function(req, res) {
    try {
      const patch = Object.assign({}, req.body);
      patch.id = req.params.id;
      const category=req.params.type;
      const results = await app.locals.model.update(category,patch);
      res.send(req.body);
    }
    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}
function doCreate(app) {
  return errorWrap(async function(req, res) {
    try {
      const obj = req.body;
      const category=req.params.type;
      const results = await app.locals.model.create(category,obj);
      res.append('Location', requestUrl(req) + '/' + obj.id);
      res.sendStatus(CREATED);
    }
    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


/**************************** Error Handling ***************************/

/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  };
}

/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      next(err);
    }
  };
}

const ERROR_MAP = {
  BAD_CATEGORY: NOT_FOUND,
  EXISTS: CONFLICT,
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapError(err) {
  console.error(err);
  return (err instanceof Array && err.length > 0 && err[0] instanceof BlogError)
    ? { status: (ERROR_MAP[err[0].code] || BAD_REQUEST),
	code: err[0].code,
	message: err.map(e => e.message).join('; '),
      }
    : { status: SERVER_ERROR,
	code: 'INTERNAL',
	message: err.toString()
      };
} 

/****************************** Utilities ******************************/

/** Return original URL for req (excluding query params)
 *  Ensures that url does not end with a /
 */
function requestUrl(req) {
  const port = req.app.locals.port;
  const url = req.originalUrl.replace(/\/?(\?.*)?$/, '');
  return `${req.protocol}://${req.hostname}:${port}${url}`;
}


const DEFAULT_COUNT = 5;

//@TODO
