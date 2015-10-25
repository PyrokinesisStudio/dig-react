//import { * } from './unicorns/goodies'
import React  from 'react';
import { Header, Footer, AudioPlayer } from './components';
import router from './services/router';

const App = React.createClass({

  getInitialState: function() {
    return { component: null };
  },

  componentWillMount: function() {
    if( global.IS_SERVER_REQUEST ) {
      this.setState(this.props);
    } else {
      router.on( 'navigateTo', specs => {
        this.setState(specs);
      });
      // 'component' here is actually the outlet component'
      if(  !this.state.component ) {
        router.navigateTo(); // current url
      }
    }
  },

  render: function() {

    //  {{if loading 'loading-screen fade'}}
    return (
      <div>
        <div id="wrap">
          <Header />
          <div className="outlet-wrap">
            {this.state.component
              ? React.createElement(this.state.component,
                {
                    store: this.state.store,
                    params: this.state.params,
                    queryParams: this.state.queryParams
                })
              : null
            }
          </div>
        </div>
        <Footer />
        <AudioPlayer />
      </div>
    );
  },
});


module.exports = App;

