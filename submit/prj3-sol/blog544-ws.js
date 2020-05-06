import assert from 'assert';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import querystring from 'querystring';

import BlogError from './blog-error.js';

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

export default function serve(port, meta, model) {
  const app = express();
  app.locals.port = port;
  app.locals.meta = meta;
  app.locals.model = model;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

function setupRoutes(app) {
  app.use(cors());
  app.use(bodyParser.json());
  app.get('/', doBase(app));
  app.get('/meta', doMeta(app));
  for (const category of Object.keys(app.locals.meta)) {
    app.get(`/${category}`, doList(app, category));
    app.get(`/${category}/:id`, doGet(app, category));
    app.post(`/${category}`, doCreate(app, category));
    app.delete(`/${category}/:id`, doDelete(app, category));
    app.patch(`/${category}/:id`, doUpdate(app, category));
  }
}

/****************************** Handlers *******************************/

function doBase(app) {
  return errorWrap(function (req, res) {
    try {
      const reqUrl = requestUrl(req);
      const links = [
	{ rel: 'self', name: 'self', url: selfQuery(req) },
	{ rel: 'describedby', name: 'meta', url: `${reqUrl}/meta` },
      ];
      for (const category of Object.keys(app.locals.meta)) {
	links.push({ rel: 'collection',
		     url: `${reqUrl}/${category}`,
		     name: category,
		   });
      }
      res.json({ links });
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doMeta(app) {
  return errorWrap(function (req, res) {
    try {
      const selfMeta = addSelf(req, [ app.locals.meta ]);
      res.json(selfMeta[0]);
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doList(app, category) {
  return errorWrap(async function (req, res) {
    try {
      const q = req.query || {};
      const q1 = Object.assign({}, q, {_count: (+q._count || DEFAULT_COUNT)+1});
      const objs1 = await app.locals.model.find(category, q1);
      const nResults1 = objs1.length;
      const objs = objs1.slice(0, q1._count - 1);
      const results = addSelf(req, objs, true);
      const [ next, nextUrl ] = pageUrl(req, nResults1, +1);
      const [ prev, prevUrl ] = pageUrl(req, nResults1, -1);
      const selfUrl = selfQuery(req, q);
      const links = [{ rel: 'self', name : "self", url: selfUrl, } ];
      if (nextUrl) links.push({ rel: 'next', name: 'next', url: nextUrl, });
      if (prevUrl) links.push({ rel: 'prev', name: 'prev', url: prevUrl, });
      res.json({ [category]: results, links, next, prev  });
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doGet(app, category) {
  return errorWrap(async function (req, res) {
    try {
      const q = req.query || {};
      const id = req.params.id;
      const filter = Object.assign({}, q, {id});
      const objs = await app.locals.model.find(category, filter);
      const results = addSelf(req, objs);
      const nResults = results.length;
      assert(nResults <= 1);
      res.json({ [category]: results });
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doCreate(app, category) {
  return errorWrap(async function (req, res) {
    try {
      const obj = req.body;
      const id = await app.locals.model.create(category, obj);
      const location = `${requestUrl(req)}/${id}`;
      res.append('Location', location);
      res.status(CREATED); res.json({});
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doDelete(app, category) {
  return errorWrap(async function (req, res) {
    try {
      const id = req.params.id;
      await app.locals.model.remove(category, {id});
      res.json({});
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doUpdate(app, category) {
  return errorWrap(async function (req, res) {
    try {
      const id = req.params.id;
      const obj = req.body;
      const update = Object.assign({}, obj, {id});
      await app.locals.model.update(category, update);
      res.json({});
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


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

/*************************** Mapping Errors ****************************/

const ERROR_MAP = {
  BAD_CATEGORY: NOT_FOUND,
  EXISTS: CONFLICT,
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapError(err) {
  const isDomainErr =
    (err instanceof Array && err.length > 0 && err[0] instanceof BlogError);
  if (!isDomainErr) console.error(err);
  return (isDomainErr)
    ? { status: (ERROR_MAP[err[0].code] || BAD_REQUEST),
	errors: err,
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

function selfQuery(req, query={}) {
  const qString = querystring.stringify(query);
  const suffix = qString.length > 0 ? `?${qString}` : '';
  return requestUrl(req) + suffix;
}

function addSelf(req, results, doId = false) {
  const baseUrl = requestUrl(req);
  return results.map(result => {
    const href = (doId) ? `${baseUrl}/${result.id}` : baseUrl;
    const links = [ { rel: 'self', name: 'self', href } ];
    return Object.assign({}, result, { links });
  });
}

const DEFAULT_COUNT = 5;

function pageUrl(req, nResults1, dir) {
  const q = req.query;
  const index = Number(q._index || 0);
  const count = Number(q._count || DEFAULT_COUNT);
  const nextIndex = (index + dir*count) < 0 ? 0 : (index + dir*count);
  const queryParams = Object.assign({}, q, { _index: nextIndex });
  const url = selfQuery(req, queryParams);
  return ((dir > 0 && nResults1 <= count) || (dir < 0 && index == 0))
         ? [undefined, undefined]
         : [ nextIndex, url ];
}


