// -*- mode: JavaScript; -*-
import mongo from 'mongodb';
import BlogError from './blog-error.js';
import Validator from './validator.js';
import assert from 'assert';
//debugger; //uncomment to force loading into chrome debugger

/**
A blog contains users, articles and comments.  Each user can have
multiple Role's from [ 'admin', 'author', 'commenter' ]. An author can
create/update/remove articles.  A commenter can comment on a specific
article.

Errors
======

DB:
  Database error

BAD_CATEGORY:
  Category is not one of 'articles', 'comments', 'users'.

BAD_FIELD:
  An object contains an unknown field name or a forbidden field.

BAD_FIELD_VALUE:
  The value of a field does not meet its specs.

BAD_ID:
  Object not found for specified id for update/remove
  Object being removed is referenced by another category.
  Other category object being referenced does not exist (for example,
  authorId in an article refers to a non-existent user).

EXISTS:
  An object being created already exists with the same id.

MISSING_FIELD:
  The value of a required field is not specified.

*/

export default class Blog544 {

  constructor(meta,client,dbproj) {
    //@TODO
    this.meta = meta;
    this.client = client;
    this.dbproj= dbproj;
    this.validator = new Validator(meta);
    
    // create collections for ueach category
    this.users= this.dbproj.collection('USERS');
    this.articles= this.dbproj.collection('ARTICLES');
    this.comments= this.dbproj.collection('COMMENTS');


  }

  /** options.dbUrl contains URL for mongo database */
  static async make(meta,options) {
    //@TODO
    // connecting to mongo and creating a database
    const mongoproj = new mongo.MongoClient(options.dbUrl,MONGO_CONNECT_OPTIONS);
    const client = await mongoproj.connect();
    const dbproj = client.db('proj2');
    
    // indexing structure
    /*
    const category={};
    for (const [category, fields] of Object.entries(meta)) {
      category = { keys: {}, indexes: {} };
      for (const field of fields) {
  if (field.doIndex) 
  data.category.indexes[field.name] = {};
      }
    }*/
    return new Blog544(meta, client,dbproj);
  }

  /** Release all resources held by this blog.  Specifically, close
   *  any database connections.
   */
  async close() {
    await this.client.close();
  }

  /** Remove all data for this blog */
  async clear() {
    await this.articles.deleteMany({});
    await this.users.deleteMany({});
    await this.comments.deleteMany({});
  }

  /** Create a blog object as per createSpecs and 
   * return id of newly created object 
   */
  async create(category, createSpecs) {
    debugger;
    const obj = this.validator.validate(category, 'create', createSpecs);
    if(createSpecs._id>0){
      const msg = `the internal mongo _id field is forbidden for users create`;
        throw [ new BlogError('BAD_FIELD', msg) ]
    }
    //to check if user exist
    if(category=='users'){
        let user= [];
        user= await this.find(category,{id:createSpecs.id});
      if(user.length>0) {
      const msg = `cannot create id ${createSpecs.id} as it already exists`;
        throw [ new BlogError('BAD_ID', msg) ];}
        else{
       // if not insert the user
    const ret = await this.users.insertOne(createSpecs);
    return obj.id;}
  }
  //insert articles
  if(category=='articles'){
    createSpecs.id = Math.random().toFixed(3);
    const ret = await this.articles.insertOne(createSpecs);
    return obj.id;
  }
  //insert comments
  if(category=='comments'){
    createSpecs.id = Math.random().toFixed(3);
    const ret = await this.comments.insertOne(createSpecs);
    return obj.id;
  }
  }

  /** Find blog objects from category which meets findSpec.  
   *
   *  First returned result will be at offset findSpec._index (default
   *  0) within all the results which meet findSpec.  Returns list
   *  containing up to findSpecs._count (default DEFAULT_COUNT)
   *  matching objects (empty list if no matching objects).  _count .
   *  
   *  The _index and _count specs allow paging through results:  For
   *  example, to page through results 10 at a time:
   *    find() 1: _index 0, _count 10
   *    find() 2: _index 10, _count 10
   *    find() 3: _index 20, _count 10
   *    ...
   *  
   */
  async find(category, findSpecs={}) {
    const obj = this.validator.validate(category, 'find', findSpecs);

    if(findSpecs._id>0){
      const msg = `the internal mongo _id field is forbidden for users find`;
        throw [ new BlogError('BAD_FIELD', msg) ]
    }
    if(category=='users'){
      // filter by count and index
      if(findSpecs._count>0 && findSpecs._index>0){
        const num= findSpecs._count;
        const indexnum= findSpecs._index;
        
        this.findSpecs=delete(findSpecs._count);
        this.findSpecs=delete(findSpecs._index);
        
      const ret = await this.users.find(findSpecs).sort({creationTime:-1}).limit(parseInt(num)).skip(parseInt(indexnum));
      const retUsers = await ret.toArray();
     return retUsers;
      }
      // filter by count
      if(findSpecs._count>0){
        const num= findSpecs._count;
        this.findSpecs=delete(findSpecs._count);
      
      const ret = await this.users.find(findSpecs).sort({creationTime:-1}).limit(parseInt(num));
      const retUsers = await ret.toArray();
     return retUsers;}

     // filter by creation time
     if(findSpecs.creationTime){
       const num= findSpecs.creationTime;
    const ret = await this.users.find({creationTime: {$lt:num }}).sort({creationTime:-1}).limit(parseInt(DEFAULT_COUNT));
    const retUsers = await ret.toArray();
   return retUsers;}

     // filter by all
     else {
      const ret = await this.users.find(findSpecs).limit(parseInt(DEFAULT_COUNT));
      const retUsers = await ret.toArray();
      
    
     return retUsers; }
    
      }
      //find articles
      else if(category==='articles'){
        const ret = await this.articles.find(findSpecs);
        const retUsers = await ret.toArray();
       return retUsers; 
      }
      //find comments
      else if(category==='comments'){
        const ret = await this.comments.find(findSpecs);
        const retUsers = await ret.toArray();
       return retUsers; 
      }
      
      

    

//return ret;
    //@TODO
    
  }

  /** Remove up to one blog object from category with id == rmSpecs.id. */
  async remove(category, rmSpecs) {
    const obj = this.validator.validate(category, 'remove', rmSpecs);
    /* Validations */
    /* user referenced in articles or comments */
    if(rmSpecs._id>0){
      const msg = `the internal mongo _id field is forbidden for users remove`;
        throw [ new BlogError('BAD_FIELD', msg) ]
    }
    if(category==='users'){
      let user= [];
      user= await this.find(category,{id:rmSpecs.id});
    
    if(user.length>0) {
      let article=[];
      let comment=[];
      
      article=await this.find('articles',{authorId:user[0].id});
      comment=await this.find('comments',{commenterId:user[0].id});
      
      if(article.length > 0 || comment.length> 0) {
        const msg = `cannot remove id ${rmSpecs.id} as it referenced by another category`;
        throw [ new BlogError('BAD_ID', msg) ];
      }
      else
      await this.users.deleteOne(rmSpecs);
    }

    }
   /* articles referenced in comments */
   if(category === 'articles') {
  // article id in comment
  
    let article= [];
    article= await this.find('articles',{authorId:rmSpecs.id});
  
  if(article.length>0) {
  
      let comment=[];
      comment=await this.find('comments',{articleId:comment[7].id});
      
  if(comment > 0) {
    const msg = `cannot remove id ${rsmSpecs.id} as it 
    referenced by another category`;
    throw [ new BlogError('BAD_ID', msg) ];
  }}
  else
  await this.articles.deleteOne(rmSpecs);
   }

  }

  /** Update blog object updateSpecs.id from category as per
   *  updateSpecs.
   */
  async update(category, updateSpecs) {
    const obj = this.validator.validate(category, 'update', updateSpecs);
    if(updateSpecs._id>0){
      const msg = `the internal mongo _id field is forbidden for users update`;
        throw [ new BlogError('BAD_FIELD', msg) ]
    }
    if(category==='users'){
      let user= [];
      user= await this.find('users',{id:updateSpecs.id});
    if(user.length>0) {
      const set = Object.assign({}, updateSpecs);
      delete set._id;
      const ret = await this.users.updateOne({ id: updateSpecs.id }, { $set: set });
    }
  else
  { const msg = `cannot update id ${updateSpecs.id} as it doesn't exist`;
  throw [ new BlogError('BAD_ID', msg) ];}
}
    if(category==='comments'){
      let comment= [];
      comment= await this.find('comments',{id:updateSpecs.id});
    if(comment.length>0) {
      const set = Object.assign({}, updateSpecs);
      delete set._id;
      const ret = await this.comments.updateOne({ id: updateSpecs.id }, { $set: set });
    }
    else
  { const msg = `cannot update id ${updateSpecs.id} as it doesn't exist`;
  throw [ new BlogError('BAD_ID', msg) ];}
  }

    if(category==='articles'){
      let article= [];
      article= await this.find('articles',{id:updateSpecs.id});
    if(article.length>0) {
      const set = Object.assign({}, updateSpecs);
      delete set._id;
      const ret = await this.articles.updateOne({ id: updateSpecs.id }, { $set: set });
    }
    else
    { const msg = `cannot update id ${updateSpecs.id} as it doesn't exist`;
    throw [ new BlogError('BAD_ID', msg) ];}}
  
}}

const DEFAULT_COUNT = 5;

const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };
