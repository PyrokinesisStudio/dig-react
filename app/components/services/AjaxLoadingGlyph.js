import React       from 'react';
import { AjaxTracker } from '../../mixins';
import LoadingGlyph    from '../vanilla/LoadingGlyph';

class AjaxLoadingGlyph extends AjaxTracker(React.Component) {

  render() {
    return <LoadingGlyph {...this.props} loading={this.state.ajax.loading} />;
  }  
}

module.exports = AjaxLoadingGlyph;