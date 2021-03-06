/* global $ */
import React       from 'react';
import ajaxAdapter from './services/query-ajax-adapter';
import router      from './services/router';
import env         from './services/env';
import events      from './models/events';

import { browserScripts,
         bindAll }        from './unicorns';
import Banner             from './components/Banner';
import AudioPlayer        from './components/AudioPlayer';

import TitleSetter  from './components/vanilla/TitleSetter';
import ErrorDisplay from './components/services/ErrorDisplay';
import Modal        from './components/services/Modal';
import Alert        from './components/services/Alert';

class App extends React.Component 
{
  constructor() {
    super(...arguments);
    bindAll( this, 'onLoading', 'onNavigateTo', 'onNavigateToThis', 'onAppAlert' );
    this.state = { component: { path: null } };
  }

  componentWillMount() {
    
    if( env.browser ) {

      ajaxAdapter.on( events.LOADING,          this.onLoading );
      router     .on( events.NAVIGATE_TO,      this.onNavigateTo );
      router     .on( events.NAVIGATE_TO_THIS, this.onNavigateToThis );
      env        .on( events.APP_ALERT,        this.onAppAlert );
    } 

    this.setState(this.props);
  }

  componentDidMount() {
    this.postUpdate();
  }

  componentDidUpdate() {
    this.postUpdate();
  }

  componentWillUnmount() {
    ajaxAdapter.removeListener( events.LOADING,          this.onLoading );
    router     .removeListener( events.NAVIGATE_TO,      this.onNavigateTo );
    router     .removeListener( events.NAVIGATE_TO_THIS, this.onNavigateToThis );
    env        .removeListener( events.APP_ALERT,        this.onAppAlert );
  }

  onNavigateTo(specs) {
    this.setState( specs, this.onNavigateToThis );
  }

  onNavigateToThis() {
    if( !this.state.hash ) {
      if( !env.disableAutoScroll ) {
        browserScripts.scrollToTop();
      }
    }
  }

  onLoading(loading) {
    $('.outlet-wrap').toggleClass('loading-screen fade',loading);
  }

  onAppAlert(alertType,alert) {
    this.setState( { alertType, alert } );
  }

  onAlertClosed() {
    this.setState( { alert: null } );
  }

  postUpdate() {
    if( env.browser ) {
      this.scrollToHash();
    }
  }

  scrollToHash() {
    var hash = this.state.hash;
    if( hash ) {
      browserScripts.scrollToHash(hash);
    }
  }

  render() {

    const { browser,
            appName } = env;

    const { header,
            footer } = this.props;

    const { component:comp = {}, 
            alert, 
            alertType, 
            store, 
            params, 
            queryParams } = this.state;

    let { selfContained,
          path,
          browserOnly,
          subnav,
          title } = comp;

    if( !path || (browserOnly && !browser) ) {
      return <p />;
    }

    const elem = React.createElement(comp, { store, params, queryParams });

    if( selfContained ) {
      return elem;
    }

    subnav && (subnav = React.createElement( subnav, { store } ));

    return (
      <div>
        <Modal.Container />
        <div id="wrap" className={appName}>
          <TitleSetter title={title} />
          <Banner />
          {header}
          {subnav}
          <ErrorDisplay />
          {alert && <Alert type={alertType} text={alert} className="system-alert" onClose={this.onAlertClosed}/>}
          <div className="outlet-wrap">{elem}</div>
        </div>
        {footer}
        <AudioPlayer />
      </div>
    );
  }
}

App.defaultProps = {
  header: React.createElement(env.header),
  footer: React.createElement(env.footer)
};


module.exports = App;

