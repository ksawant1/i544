// -*- mode: JavaScript; -*-

import BlogError from './blog-error.js';
import Validator from './validator.js';

//debugger; //uncomment to force loading into chrome debugger

/**
A blog contains users, articles and comments.  Each user can have
multiple Role's from [ 'admin', 'author', 'commenter' ]. An author can
create/update/remove articles.  A commenter can comment on a specific
article.

Errors
======

BAD_CATEGORY:
  Category is not one of 'articles', 'comments', 'users'.

BAD_FIELD:
  An object contains an unknown field name or a forbidden field.

BAD_FIELD_VALUE:
  The value of a field does not meet its specs.

BAD_ID:
  Object not found for specified id for update/remove
  // if id does  not exist
  // eg id not found

  Object being removed is referenced by another category.
  // if exists raise error
  // eg if you're trying to delete a user who has articles or comments.


  Other category object being referenced does not exist (for example,
  authorId in an article refers to a non-existent user).
  // if not exists raise error
  // if you're updating an article or commenter id but the user does not exist

EXISTS:
  An object being created already exists with the same id.
  // if id exists
  // duplicate id


MISSING_FIELD:
  The value of a required field is not specified.

*/

export default class Blog544 {

  constructor(meta, options) {
    //@TODO
    this.meta = meta;
    this.data = {
      'users':[],
      'articles': [],
      'comments':[]
    }

    this.options = options;
    this.validator = new Validator(meta);
  }

  static async make(meta, options) {
    //@TODO
    
    return new Blog544(meta, options);
  }

  /** Remove all data for this blog */
  async clear() {
    //@TODO
    this.data = {
      'users':[],
      'articles': [],
      'comments':[]
    }

  }

  /** Create a blog object as per createSpecs and 
   * return id of newly created object 
   */
  async create(category, createSpecs) {
    

    const obj = this.validator.validate(category, 'create', createSpecs);
    //@TODO

    // validation for EXISTS
    if(this.data[category].length > 0 && 
      category === 'users' && 
      createSpecs.id !== undefined && 
      this.data[category].findIndex((item) => item.id.toString().toLowerCase().includes(createSpecs.id.toLowerCase())) > -1) {
      const msg = `object with id ${createSpecs.id} already exists for ${category}`;
      throw [ new BlogError('EXISTS', msg) ];
    }


    if (category !== 'users')
    createSpecs['id'] = Math.random();
    if (category==='articles')
    return this.data.articles.filter(item=>item.id);
    this.data[category].push(createSpecs);
  }

  /** Find blog objects from category which meets findSpec.  Returns
   *  list containing up to findSpecs._count matching objects (empty
   *  list if no matching objects).  _count defaults to DEFAULT_COUNT.
   */
  async find(category, findSpecs={}) {
  
    const obj = this.validator.validate(category, 'find', findSpecs);
    //@TODO use array filter
    let keys = Object.keys(findSpecs);
    /* Validations */

    // DOES NOT EXIST
    if(keys.length>0 && findSpecs.hasOwnProperty('id') && this.data[category].findIndex((item) => item.id.toString().toLowerCase().includes(findSpecs.id.toLowerCase())) === -1) {
      
      const msg = `object with id ${findSpecs.id} does not exists for ${category}`;
      throw [ new BlogError('BAD_ID', msg) ];
    }

    
    /* end of Validations */


    
    if(keys.length == 0) {
      // no parameters sent
      return this.data[category];

    } else if(category === 'users' && keys[0] === 'id') {
      // filter by id
      return this.data.users.filter(item=>item.id.toString().includes(findSpecs.id));

    } else if(category === 'users' && keys[0] === '_count') {
      // first n object
      return this.data.users.slice(0, findSpecs['_count']);

    } else if(category === 'comments' && keys[0] === 'commenterId') {
      // filter by id
      return this.data.comments.filter(item=>item.commenterId.includes(findSpecs.commenterId));

    } else if(category === 'comments' && keys[0] === 'id') {
      // filter by id
      return this.data.comments.filter(item=>item.id.toString().includes(findSpecs.id)); 

    } else if(category === 'articles' && keys[0] === 'id') {
      return this.data.articles.filter(item=>item.id.toString().includes(findSpecs.id));
    } else if(category === 'articles' && keys[0] === '_count') {
      // first n object
      return this.data.articles.slice(findSpecs['_count']);

    }

    

    return null;
  }

  /** Remove up to one blog object from category with id == rmSpecs.id. */
  async remove(category, rmSpecs) {
    const obj = this.validator.validate(category, 'remove', rmSpecs);
    //@TODO use array filter

    /* Validations */
    
    /* user referenced in articles or comments */
    if(category === 'users') {
      // user id in article
      let article = this.data.articles.findIndex((item) => item.authorId === rmSpecs.id);

      // user id in comments
      let comment = this.data.comments.findIndex((item) => item.commenterId === rmSpecs.id);
      if(article > -1 || comment > -1) {
        const msg = `cannot remove id ${rmSpecs.id} as it referenced by another category`;
        throw [ new BlogError('BAD_ID', msg) ];
      }

    }

    

    /* articles referenced in comments */
    if(category === 'articles') {
    // article id in comments
    let comment = this.data.comments.findIndex((item) => item.commenterId === rmSpecs.id);
    if(comment > -1) {
      const msg = `cannot remove id ${rmSpecs.id} as it referenced by another category`;
      throw [ new BlogError('BAD_ID', msg) ];
    }

  }


    /* end of Validations */

    
    //@TODO 
    let idx = this.data[category].findIndex((item) => item.id.toString().toLowerCase().includes(rmSpecs.id.toLowerCase()));
        
    // if index exists
    if(idx >= 0)
    this.data[category].splice(idx, 1);
  }


  /** Update blog object updateSpecs.id from category as per
   *  updateSpecs.
   */
  async update(category, updateSpecs) {
    const obj = this.validator.validate(category, 'update', updateSpecs);

    
    // Updating an object with a reference ID which does not exist
    if(this.data[category].findIndex((item) => item.id.toString().toLowerCase().includes(updateSpecs.id.toLowerCase())) === -1) {
      const msg = `${updateSpecs.id} does not exists for ${category}`;
      throw [ new BlogError('BAD_ID', msg) ];
    }

    //@TODO use array find/filter and update accordingly
    let idx = this.data[category].findIndex(item => item.id.includes(updateSpecs.id));
    // if index exists
    if(idx >= 0)

    this.data[category][idx].lastName=updateSpecs.lastName;
    this.data[category][idx].firstName=updateSpecs.firstName;
    this.data[category][idx].email=updateSpecs.email;
    this.data[category][idx].roles=updateSpecs.roles;

    


    
  
  }
}

//You can add code here and refer to it from any methods in Blog544.
