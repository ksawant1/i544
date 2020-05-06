//-*- mode: javascript -*-

import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import Path from 'path';
import mustache from 'mustache';
import querystring from 'querystring';

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

//emulate commonjs __dirname in this ES6 module
const __dirname = Path.dirname(new URL(import.meta.url).pathname);
//const __dirname= 'C:\\Users\\krupa\\projects\\i544\\submit\\prj4-sol';

export default function serve(port, ws) {
  const app = express();
  app.locals.port = port;
  app.locals.ws = ws;       //web service wrapper
  process.chdir(__dirname); //so paths relative to this dir work
  setupTemplates(app);
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

/******************************** Routes *******************************/

function setupRoutes(app) {
  app.use('/', express.static(STATIC_DIR));
  app.get('/search/users', doSearch(app));
  app.get('/users/:id', listUsers(app));
  app.get('/users', listUsers(app));
  app.use(doErrors(app)); //must be last   
}

/****************************** Handlers *******************************/

//@TODO: add handlers
function listUsers(app) {
  return async function(req, res) {
    const category = 'users';
    const filter = req.query;
    const filters= req.params;
    const thing = await app.locals.ws.list(category, filter);
    if (thing.next >= 0){
      var next_cond = true;
  }
    if(thing.prev >= 0) {
      var prev_cond = true;
    }

    const model = {users: thing.users, links: thing.links, next: thing.next, prev: thing.prev, prev_cond: prev_cond,next_cond: next_cond };
    const html = doMustache(app, 'listusers', model);
    if(filters.id){
      const result = await app.locals.ws.list(category,filters);
      if(result)
      await res.send(result.users);
    }
    else
    await res.send(html);
  };
};
/************************** Field Definitions **************************/

const FIELDS_INFO = {
  id: {
    friendlyName: 'User Id',
    isSearch: true,
    isId: true,
    isRequired: true,
    regex: /^\w+$/,
    error: 'User Id field can only contain alphanumerics or _',
  },
  firstName: {
    friendlyName: 'First Name',
    isSearch: true,
    regex: /^[a-zA-Z\-\' ]+$/,
    error: "First Name field can only contain alphabetics, -, ' or space",
  },
  lastName: {
    friendlyName: 'Last Name',
    isSearch: true,
    regex: /^[a-zA-Z\-\' ]+$/,
    error: "Last Name field can only contain alphabetics, -, ' or space",
  },
  email: {
    friendlyName: 'Email Address',
    isSearch: true,
    type: 'email',
    regex: /^[^@]+\@[^\.]+(\.[^\.]+)+$/,
    error: 'Email Address field must be of the form "user@domain.tld"',
  },
  birthDate: {
    friendlyName: 'Date of Birth',
    isSearch: false,
    type: 'date',
    regex: /^\d{4}\-\d\d?\-\d\d?$/,
    error: 'Date of Birth field must be of the form "YYYY-MM-DD"',
  },

};

const FIELDS =
    Object.keys(FIELDS_INFO).map((n) => Object.assign({name: n}, FIELDS_INFO[n]));




function doSearch(app) {
  return async function(req, res) {
    const category = 'users';
     let users=[];
    let errors = undefined;
    const isSubmit = req.query.submit !== undefined;
    const search = getNonEmptyValues(req.query);
    if (isSubmit) {
      errors = validate(search);
      if (Object.keys(search).length === 0) {
        const msg = 'at least one search parameter must be specified';
        errors = Object.assign(errors || {}, { _: msg });
      }
      if (!errors) {
        try {
          users = await app.locals.ws.list(category,search);
          var user_len=Object.keys(users.users).length;
        }
        catch (err) {
          console.error(err);
          errors = wsErrors(err);
        }
        if (user_len === 0) {
          errors = {_: 'no users found for specified criteria; please retry'};
        }

          }
        }



    let model, template;
    if (user_len>0) {
      template = 'listusers';
      //users.map((u) => ({id: u.id, fields: fieldsWithValues(u)}));
       model = {users: users.users, links: users.links};
    }
    else {
      template =  'searchusers';
      model = errorModel(app, 'searchusers',errors);
    }
    const html = doMustache(app, template, model);
    res.send(html);
  };
};

function doErrors(app) {
  return async function(err, req, res, next) {
    console.log('doErrors()');
    const errors = [ `Server error` ];
    const html = doMustache(app, `errors`, {errors, });
    res.send(html);
    console.error(err);
  };
}
function validate(values, requires=[]) {
  const errors = {};
  requires.forEach(function (name) {
    if (values[name] === undefined) {
      errors[name] =
          `A value for '${FIELDS_INFO[name].friendlyName}' must be provided`;
    }
  });
  for (const name of Object.keys(values)) {
    const fieldInfo = FIELDS_INFO[name];
    const value = values[name];
    if (fieldInfo.regex && !value.match(fieldInfo.regex)) {
      errors[name] = fieldInfo.error;
    }
  }
  return Object.keys(errors).length > 0 && errors;
}

/** Return copy of FIELDS with values and errors injected into it. */
function fieldsWithValues(values, errors={}) {
  return FIELDS.map(function (info) {
    const name = info.name;
    const extraInfo = { value: values[name] };
    if (errors[name]) extraInfo.errorMessage = errors[name];
    return Object.assign(extraInfo, info);
  });
}

/************************ General Utilities ****************************/

/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      console.log('errorWrap()');
      next(err);
    }
  };
}
function getNonEmptyValues(values) {
  const out = {};
  Object.keys(values).forEach(function(k) {
    if (FIELDS_INFO[k] !== undefined) {
      const v = values[k];
      if (v && v.trim().length > 0) out[k] = v.trim();
    }
  });
  return out;
}
function isNonEmpty(v) {
  return (v !== undefined) && v.trim().length > 0;
}

/** Return a model suitable for mixing into a template */
function errorModel(app, values={}, errors={}) {
  return {
    base: app,
    errors: errors._,
    fields: fieldsWithValues(values, errors)
  };
}
function wsErrors(err) {
  const msg = (err.message) ? err.message : 'web service error';
  console.error(msg);
  return { _: [ msg ] };
}
/************************ Mustache Utilities ***************************/

function doMustache(app, templateId, view) {
  const templates = { footer: app.templates.footer };
  return mustache.render(app.templates[templateId], view, templates);
}

function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}

