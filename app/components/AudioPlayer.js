/* globals $ */
import React from 'react';
import Glyph from './Glyph';
import Link  from './Link';

import AudioPlayerService from '../services/audioPlayer';

const PlaybackScrubber = React.createClass({

  getInitialState: function() {
    return {
        isMouseDown: false,
        position: this.props.position
      };
  },

  click: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  mouseDown: function() {
    this.setState( { isMouseDown: true } );
  },

  mouseUp: function(evt) {
    this.setState( { isMouseDown: false } );
    this.sendPostion(evt.offsetX);
  },

  mouseMove: function(evt) {
    if( this.state.isMouseDown ) {
      this.sendPostion(evt.offsetX);
    }
  },

  sendPostion: function(offset) {
    var ratio = offset / $(this.refs['position']).width();
    this.props.media.setPositionPercentage(ratio*100);
  },

  loadingWidth: function() {

    var loaded = this.state.position.bytesLoaded;
    var val = 0;
    if( loaded > 0  ) {
      val = 100 * (loaded /  this.state.position.bytesTotal);
    }
    return val + '';
    
  },

  positionWidth: function() {

    var position = this.state.position.position;
    var val = 0;
    if( position > 0 ) {
      val = 100 * (position / this.state.position.duration);
    }
    return (val + '');      

  },

  render: function() {
    var loadCss = { width: this.loadingWidth() + '%' };
    var posCss  = { width: this.positionWidth() + '%' };

    return (
        <div onClick={this.click}>
          <div className="waveimage bar" />
          <div className="loaded bar"   ref="loading"  style={loadCss} />
          <div className="position bar"
               ref="position" 
               style={posCss}
               onMouseMove={this.onMouseMove}
               onMouseDown={this.onMouseDown}
               onMouseUp={this.onMouseUp}
          />
        </div>
      );
  }
});

const PlayControls = React.createClass({

  getInitialState: function() {
    return this.props.controls;
  },

  playPrevious: function(e) {
    e.stopPropagation();
    e.preventDefault();
    AudioPlayerService.playPrevious();
  },

  togglePause: function(e) {
    e.stopPropagation();
    e.preventDefault();
    AudioPlayerService.togglePause();
  },

  playNext: function(e) {
    e.stopPropagation();
    e.preventDefault();
    AudioPlayerService.playNext();
  },

  render: function() {

    var prevClass    = 'btn play-previous ' + ( this.state.hasPrev ? '' : 'disabled' );
    var nextClass    = 'btn play-next '     + ( this.state.hasNext ? '' : 'disabled' );
    var playIcon     = this.state.isPaused ? 'play' : 'pause';

    return (
      <div className="btn-group pull-left">
          <a href="#" onClick={this.playPrevious} className={prevClass} >
            <Glyph icon="backward" />
          </a>
          <a href="#" onClick={this.togglePause}  className="btn play"  >
            <Glyph icon={playIcon} />
          </a>
          <a href="#" onClick={this.playNext}     className={nextClass}>
            <Glyph icon="forward" />
          </a>
      </div>
    );
  },

});

const PlaylistButton = React.createClass({

  getInitialState: function() {
    return { hasPlaylist: this.props.hasPlaylist };
  },

  render: function() {

    var hasPlaylist = this.state.hasPlaylist;

    return(
        hasPlaylist
          ? (<div className="pull-right">
              <Link href="/nowplaying" className="btn btn-sm btn-info" id="playlist-button">
                <Glyph icon="music" />{" playlist"}
              </Link>
            </div>)
          : null     
      );
  }
});

const TrackTitleLink = React.createClass({

  getInitialState: function() {
    return this.props;
  },

  render: function() {
    if( !this.state.name ) {
      return null;
    }
    var trackHREF  = '/files/' + this.state.artistID + '/' + this.state.id;
    return (
      <h4 className="media-heading"><Link href={trackHREF}>{this.state.name}</Link></h4>
    );
  },

});

const ArtistLink = React.createClass({

  getInitialState: function() {
    return this.props;
  },

  render: function() {
    if( !this.state.id ) {
      return null;
    }
    var userHREF   = '/people/' + this.state.id;
    return (
      <Link href={userHREF} className="user"><span className="light-color">{this.state.name}</span></Link>
    );
  }
});

const AudioPlayer = React.createClass({

  getInitialState: function() {
    return { nowPlaying: null,
             isPlaying: false,
             isPaused: false,
             position: { 
                bytesLoaded: -1,
                bytesTotal: -1,
                position: -1,
                duration: -1,
              }              
            };
  },

  componentWillMount: function() {
    AudioPlayerService.on('nowPlaying',this.onNowPlaying);
  },

  onNowPlaying: function(nowPlaying) {
    if( this.state.nowPlaying ) {
      this.state.nowPlaying.removeListener( 'controls', this.onControls );
      this.state.nowPlaying.removeListener( 'position',  this.onPosition );
    }
    if( nowPlaying ) {
      nowPlaying.on( 'controls', this.onControls );
      nowPlaying.on( 'position',  this.onPosition );

      this.setRefsStates(nowPlaying);
      this.updateControlsStates(nowPlaying);

    } else {
      this.setState( { nowPlaying } );
    }
  },

  setRefsStates: function( nowPlaying ) {
    if( this.refs && 'artist' in this.refs ) {
      this.refs['artist'].setState( {
        id: nowPlaying.artist.id,
        name: nowPlaying.artist.name
      });

      this.refs['trackTitle'].setState( {
        artistID: nowPlaying.artist.id,
        id: nowPlaying.id,
        name: nowPlaying.name
      });

      this.refs['playlistButton'].setState( {
        hasPlaylist: !!AudioPlayerService.playlist
      });
    }
  },

  getControlsState: function(nowPlaying) {
    return {
        isPaused: nowPlaying.isPaused,
        hasNext: AudioPlayerService.hasNext(),
        hasPrev: AudioPlayerService.hasPrev()
      };
  },

  updateControlsStates: function(nowPlaying) {
    if( this.refs && 'controls' in this.refs ) {
      this.refs['controls'].setState( this.getControlsState(nowPlaying) );
    }

    this.setState( 
        { nowPlaying,
          isPaused: nowPlaying.isPaused,
          isPlaying: nowPlaying.isPlaying
        } );
  },

  onControls: function(nowPlaying) {
    this.updateControlsStates(nowPlaying);
  },

  onPosition: function(position) {
    this.refs['scrubber'].setState( { position } );
    this.setState( { position } );
  },

  render: function() {
    if( !this.state.nowPlaying ) {
      return null;
    }
    var nowPlaying   = this.state.nowPlaying;
    var artist       = nowPlaying.artist;
    var position     = this.state.position;
    var articleClass = 'clearfix audio-player ' + ( this.state.isPlaying ? 'is-playing' : '' );
    var hasPlaylist  = !!AudioPlayerService.playlist;
    var controlState = this.getControlsState(nowPlaying);

    return(
      <nav className="navbar navbar-default navbar-fixed-bottom">
        <div className="container-fluid">
          <article className={articleClass} >
            <PlayControls ref="controls" controls={controlState} />
            <div className="media-body clearfix">
              <PlaylistButton   ref="playlistButton" media={nowPlaying} hasPlaylist={hasPlaylist} />
              <TrackTitleLink   ref="trackTitle"  artistID={artist.id} id={nowPlaying.id} name={nowPlaying.name} />
              <ArtistLink       ref="artist"  id={artist.id} name={artist.name} />
              <PlaybackScrubber ref="scrubber" media={nowPlaying} position={position} />
            </div>
          </article>
        </div>
      </nav>

      );
  },
});

AudioPlayer.PlayButton = React.createClass({

  getInitialState: function() {
    AudioPlayerService.bindToNowPlaying(this.props.model);
    var media = this.props.model.media;
    return { isPlaying: media && media.isPlaying, 
             media,
             isMediaHooked: false };
  },

  componentWillUnmount: function() {
    if( this.state.isMediaHooked ) {
      this.state.media.removeListener( 'controls', this.onControls );
    }
  },

  togglePlay: function(e) {
    e.stopPropagation();
    e.preventDefault();
    var upload = this.props.model;
    AudioPlayerService.togglePlay(upload);
    if( !this.state.isMediaHooked ) {
      var media = upload.media;
      media.on('controls',this.onControls);
      this.setState( { media, isMediaHooked: true } );
    }
  },

  onControls: function(media) {
    this.setState( { isPlaying: media.isPlaying } );
  },

  render: function() {
    var playStop = this.state.isPlaying ? 'stop' : 'play'; 
    var cls      = 'btn btn-info btn-lg';
    var sz       = this.props.big ? 'x4' : '';
    var fixed    = this.props.fixed || false;
    return (<a className={cls} href="#" onClick={this.togglePlay}><Glyph fixed={fixed} sz={sz} icon={playStop} /></a>);
  },

});

module.exports = AudioPlayer;

