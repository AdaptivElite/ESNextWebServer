﻿exports.MongoEntity = class MongoEntity extends Object{
  constructor(database, module, masterdb = null ) {
    super();
    this.module = module;
    this._db = database;
    this._dbMaster = masterdb;
    this._consturctedClass = {
      Save : async function(){
        await this.GetCollection().Save( this );
      },
      Delete : async function(){
        await this.GetCollection().Delete( this );
      },
      GetCollection : () => this
    };
    this._SetupConstructedClass();
  }

  _SetupConstructedClass(){
    let methods = Object.getOwnPropertyNames( Object.getPrototypeOf(this) );
    let coreMethods = Object.getOwnPropertyNames( MongoEntity.prototype );
    for( let i = 0; i < methods.length; i++ ){
      if( coreMethods.indexOf(methods[i]) === -1 && !methods[i].toLowerCase().endsWith("model") ){
        this._consturctedClass[methods[i]] = this[methods[i]];
      }
    }
  }

  async OnSave( item ){

  }

  async OnDelete( item ){

  }

  async OnInsert( item ){

  }

  async OnRemove( selector, justone ){

  }

  get defaultProjection(){ return null; }

  get defaultSelection(){ return null; }

  get projections(){ return {}; }

  get selections(){ return {}; }

  get _collection(){ return null; }

  Find( selector = {}, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      let projection = {};
      if( options.projection !== undefined ){
        projection = options.projection;
      }
      this._db.collection( this._collection || options.collection ).find( selector, projection, options ).toArray( ( err, results ) => {
        if( !err ) {
          resolve( results.map( (result) => Object.assign( result, this._consturctedClass ) ) );
        }
        else {
          reject( err );
        }
      } );
    });
  }

  Count( selector = {}, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      let projection = {};
      if( options.projection !== undefined ){
        projection = options.projection;
      }
      this._db.collection( this._collection || options.collection ).count( selector, projection, options, ( err, count ) => {
        if( !err ) {
          resolve( count );
        }
        else {
          reject( err );
        }
      } );
    } );
  }

  FindOne( selector = null, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      let projection = {};
      if( options.projection !== undefined ){
        projection = options.projection;
      }
      this._db.collection( this._collection || options.collection ).findOne( selector, projection, options, ( err, result ) => {
        if( !err ) {
          if( result === null ){
            resolve( null );
          }
          else{
            resolve( Object.assign( result, this._consturctedClass ) );
          }
        }
        else {
          reject( err );
        }
      });
    });
  }

  Insert( document, options = {} ) {
    return new Promise( async ( resolve, reject ) => {
      let db = this._db;
      if( this._dbMaster !== null ){
        db = this._dbMaster;
      }
      await this.OnSave( document );
      await this.OnInsert( document );
      db.collection( this._collection || options.collection ).insert( document, options, ( err, result ) => {
        if( !err ) {
          resolve( Object.assign( result.ops[0], this._consturctedClass ) );
        }
        else {
          reject( err );
        }
      });
    });
  }

  Remove( selector, justone = true ){
    return new Promise( async ( resolve, reject ) => {
      let db = this._db;
      if( this._dbMaster !== null ){
        db = this._dbMaster;
      }
      await this.OnRemove( selector, justone );
      db.collection( this._collection || options.collection ).remove( selector, justone, ( err, numberOfRemovedDocs ) => {
        if( !err ){
          resolve( numberOfRemovedDocs );
        }
        else{
          reject( err );
        }
      } );
    });
  }

  Drop( errorOnNotFound = false ){
    return new Promise( ( resolve, reject ) => {
      let db = this._db;
      if( this._dbMaster !== null ){
        db = this._dbMaster;
      }
      db.collection( this._collection ).drop( ( err, reply ) => {
        if( !err || ( err.message === "ns not found" && !errorOnNotFound ) ){
          resolve( reply );
        }
        else{
          reject( err );
        }
      });
    });
  }

  /**
   * Updates a the mongo collection, awaitable.
   * @param object selector - The mongo selector.
   * @param object document - The mongo document.
   * @param object options - The mongo options for the update query.
   */
  Update( selector, document, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      let db = this._db;
      if( this._dbMaster !== null ){
        db = this._dbMaster;
      }
      db.collection( this._collection ).update( selector, document, options, ( err, result ) => {
        if( !err ) {
          resolve( result );
        }
        else {
          reject(err);
        }
      });
    } );
  }

  async Delete( item, options = {} ){
    await this.OnDelete( item );
    await this.Remove( { _id : item._id }, true );
  }

  Save( item, options = {} ){
    return new Promise( async ( resolve, reject ) => {
      let db = this._db;
      if( this._dbMaster !== null ){
        db = this._dbMaster;
      }
      await this.OnSave( item );
      db.collection( this._collection ).update( { _id : item._id }, { $set : item }, options, ( err, result ) => {
        if( !err ) {
          resolve( result );
        }
        else {
          reject(err);
        }
      });
    } );
  }
}
