import querystring from 'querystring';
import Query       from './query';
import events      from '../models/events';
import Tags        from './tags';
import env         from '../services/env';

import { oassign,
         hashParams,
         cleanSearchString,
         TagString }   from '../unicorns';


/*
  Collection stores support, a minimum, a model that
  has :
    model {
      items - array
      total - Number
    }
  Depending on the query string used for getModel() 
  it may also include:
      artist   - 'u' or 'user' a profile of an user
      artists  - 'searchp' search results in user database
      genres   - 'searchp' search results in genre tags
      totals   - hash of totals for reqtags (see ./totals)

*/
const MIN_GENRE_TAG_SIZE = 2;

class Collection extends Query {

  constructor(defaultParams) {
    super(...arguments);
    this.model         = {};
    this.defaultParams = defaultParams || {};
    this.gotCache      = false;
    this._tags         = null;
    this.tagFields     = ['tags', 'reqtags', 'oneof'];
    this.totalsCache   = null;
    this.autoFetchUser = true;
  }

  get supportsOptions() {
    return true;
  }

  get queryString() {
    return this._queryString(false);
  }

  get queryStringWithDefaults() {
    return this._queryString(true);
  }

  get queryParams() {
    return this._expandQP(this.model.queryParams);
  }
  
  get tagStore() {
    if( !this._tags ) {
      this._tags = new Tags();
    }
    return this._tags;
  }

  paginate(offset) {
    return this._refresh(this._qp({offset},events.PARAMS_CHANGED));
  }

  // use this instead of the property if you
  // need the return promise
  applyTags(tags) {
    var qp = { tags: tags.toString() };
    return this.refreshModel(qp).then( model =>{
      this.emit(events.TAGS_SELECTED);
      return model;
    });
  }

  applyURIQuery(qp) {
    return this.refreshModel(qp);    
  }

  refresh(queryParams) {
    queryParams.offset = 0;
    return this._refresh(this._qp(queryParams,events.PARAMS_CHANGED));
  }

  refreshModel(queryParams) {
    queryParams.offset = 0;
    return this.getModel(this._qp(queryParams,events.PARAMS_CHANGED));
  }

  applyDefaults() {
    return this._applyDefaults([events.GET_PARAMS_DEFAULT]);
  }

  applyURIDefault() {
    return this._applyDefaults([ events.GET_PARAMS_DEFAULT, events.GET_PARAMS_URI ]);
  }

  paramsDirty() {
    var qp      = this._expandQP(this.model.queryParams);
    var def     = this._expandQP(this.defaultParams);
    var isDirty = { isDirty: false };
    this.emit( events.ARE_PARAMS_DIRTY, qp, def, isDirty );
    return isDirty.isDirty;
  }

  getModel( queryParams ) {
    const { totalsCache } = this;
    if( totalsCache ) {
      const { reqtags } = queryParams;
      var tag = totalsCache.cacheableTagFromTags( reqtags );
      if( tag ) {
        /*
          There's been a query for a reqtag that's part of the 
          'totals' count. Tell the cache to create/fetch all
          the totals. The result of this will be picked up
          in _getModel.
        */
        return totalsCache.getTotals(queryParams,this).then( totals => {
          /*
              WARNING: BIG POLICY ASSUMPTION BURIED IN THE BOWELS AHEAD:

              The use case assumed here is that there are several nav tabs
              that represent reqtags. 

              There are several cases within that scenario where the 
              requesting nav tab (i.e. reqtag) return no results (like
              the default tab 'edpick' for a user that doesn't have 
              any edpicks or if the url goes directly to 'spoken word'
              for a bpm filtered acappella query that returns no 
              results, etc. etc.)

              In that case we assume the caller will want the 'all'
              case returned and will notice when checking the 'totals'
              part of the model that the requested reqtag doesn't
              have any results.

              TODO: don't assume this behavoir and have a policy flag 
                    to determine how to handle these cases.

          */
          if( !totals[tag] ) {
            queryParams.reqtags = new TagString(reqtags).remove(tag).toString();
          }
          /*
            OK, the 'totals' cache has been set up, now it time to get the
            actual query requested here.
          */
          return this._getModel(queryParams);
        });
      }
    }
    return this._getModel(queryParams);
  }

  _getModel(queryParams) {
    if( !('dataview' in queryParams) && !('t' in queryParams) ) {
      queryParams.dataview = 'links_by';
    }
    
    queryParams.offset = queryParams.offset || 0;

    var hasSearch = 'searchp' in queryParams;

    if( hasSearch ) {
      queryParams.searchp = cleanSearchString( queryParams.searchp );
    }

    var user = queryParams.u || queryParams.user;

    var hash = {
      items:  this.cachedFetch(queryParams,'items'),
      total:  this.count(queryParams,'total'),
      artist: (user && this.autoFetchUser) ? this.findUser(user,'artist') : null,
    };

    if( hasSearch) {
      var text = queryParams.searchp;

      hash.artists = [];
      hash.genres  = [];

      if( text ) {
        hash.artists = this.searchUsers({
                    limit: 40,
                    remixmin: 1,
                    searchp: text
                  },'artists');
        hash.genres = this.tagStore.searchTags( text.split(/\s/).filter( t => t.length > MIN_GENRE_TAG_SIZE ), 'genres' );
      }
    }

    if( this.totalsCache ) {
      hash.totals = this.totalsCache.getTotals(queryParams,this);
    }
    
    hash = this.promiseHash(hash,queryParams);
    
    this.error = null;

    return this.flushDefers(hash).then( model => {
      this.model = model;
      model.queryParams = oassign( {}, queryParams );
      this.emit( events.MODEL_UPDATED, model );
      return model;
    }).catch( e => {
      if( e.message === events.ERROR_IN_JSON ) {
        this.model.items = [];
        this.model.total = 0;
        this.model.error = this.error = e.message;
        this.model.artist = {};
        this.model.queryParams = oassign( {}, queryParams );
        return this.model;
      } else {
        var str = /*decodeURIComponent*/(querystring.stringify(queryParams));
        throw new Error( `${str} original: ${e.toString()}-${e.stack}`);
      }
    });

  }

  /* protected */

  promiseHash( hash /*, queryParams */) {
    return hash;
  }

  cachedFetch(queryParams, deferName) {
    if( !env.debugMode && !this.gotCache ) {
      var qp = oassign( {}, queryParams);
      qp['cache'] = '_' + hashParams(queryParams).hashCode();
      this.gotCache = true;
      queryParams = qp;
    }
    return this.fetch(queryParams,deferName);
  }

  /* private */

  _expandQP(queryParams) {
    var qp   = oassign( {}, queryParams );
    this.tagFields.forEach( f => qp[f] = new TagString(qp[f]) );
    return qp;
  }

  _contractQP(queryParams,result) {
    for( var k in queryParams ) {
      if( this.tagFields.includes(k) ) {
        if( queryParams[k].getLength() > 0 ) {
          result[k] = queryParams[k].toString();
        }
      } else if( k === 'offset' ) {
        if( queryParams.offset > 0 ) {
          result.offset = queryParams.offset;
        }
      } else {
        const { [k]:val = null } = queryParams;

        if( val !== null ) {
          result[k] = val;
        }
      }
    }
    return result;
  }

  _qp(queryParams,event) {
    var qp = this.model.queryParams;
    oassign( qp, queryParams); // paste over model's queryParams
    var qpt  = this._expandQP(qp);
    this.emit( event, qpt, this );
    return qp;
  }

  _applyDefaults(events) {
    var qp  = oassign( {}, this.model.queryParams, this.defaultParams, { offset: 0 } );
    var qpt = this._expandQP(qp);
    events.forEach( e => this.emit( e, qpt, this ) );
    var qpc = this.model.queryParams = this._contractQP( qpt, {} );
    return this.refreshModel(qpc);
  }

  _refresh(queryParams,deferName) {
    return this.fetch(queryParams,deferName).then( items => {
      this.model.items = items;
      this.emit( events.MODEL_UPDATED );
      return this.model;
    });
  }

  _queryString(withDefault) {
    var qp   = this.model.queryParams;
    var defs = this.defaultParams;
    var copy = withDefault ? oassign( {}, defs) : {};
    var skip = [ 'f', 'dataview'];

    for( var k in qp ) {
      if( !skip.includes(k) ) {
        if( k === 'offset' ) {
          if( qp.offset > 0 ) {
            copy.offset = qp.offset;
          }
        } else {
          if( !withDefault && k in defs ) {
            if( this.tagFields.includes(k) ) {
              if( qp[k] && !(new TagString(defs[k])).isEqual(qp[k]) ) {
                copy[k] = qp[k];
              }
            } else {
              if( qp[k] !== defs[k] ) {
                copy[k] = qp[k];
              }
            }
          } else {
            if( qp[k] ) {
              copy[k] = qp[k];
            }
          }
        }
      }
    }
    return querystring.stringify(copy);    
  }
}

module.exports = Collection;