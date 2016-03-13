import React  from 'react';
import Glyph  from '../Glyph';
import events from '../../models/events';

import AudioService from '../../services/audio-player';

var PlayButton = React.createClass({

  getInitialState() {
    var media = this.bindToModel(this.props.model);
    return this.stateFromMedia(media);
  },

  componentWillMount() {
    this.hookEvents();
  },

  componentWillReceiveProps( nextProps ) {
    var media = nextProps.model.media;
    if( this.state.media ) {
      if( media && this.state.media.url === media.url ) {
        return;
      }
      this.unhookEvents();
    }
    media = this.bindToModel(nextProps.model);
    this.setState( this.stateFromMedia(media), () => this.hookEvents() );
  },

  componentWillUnmount() {
    this.unhookEvents();
  },

  bindToModel(model) {
    if( !global.IS_SERVER_REQUEST ) {
      if( !AudioService.bindToNowPlaying(model) ) {
        AudioService.attachMedia(model);
      }
    }
    return model.media;
  },

  stateFromMedia(media) {
    var isPlaying = media && media.isPlaying;
    return { isPlaying, media };
  },

  hookEvents() {
    if( this.state.media ) {
      this.state.media.on( events.CONTROLS, this.onControls );
    }
  },

  unhookEvents() {
    if( this.state.media ) {
      this.state.media.removeListener( events.CONTROLS, this.onControls );
    }
  },

  togglePlay(e) {
    e.preventDefault();
    AudioService.togglePlay(this.props.model);
    if( this.props.onPlay ) {
      this.props.onPlay();
    }
  },

  onControls(media) {
    this.setState( { isPlaying: media.isPlaying } );
  },

  render() {
    var playStop = this.state.isPlaying ? 'stop' : 'play'; 
    var cls      = 'btn btn-info btn-lg ' + (this.props.className || '');
    var sz       = this.props.big ? 'x4' : '';
    var fixed    = this.props.fixed || false;
    return (<a className={cls} href="#" onClick={this.togglePlay}><Glyph fixed={fixed} sz={sz} icon={playStop} /></a>);
  },

});

module.exports = PlayButton;

