import React        from 'react';
import Slider       from '../../vanilla/Slider';
import PropertyState from '../mixins/PropertyState';

class SliderFilter extends PropertyState(React.Component)
{
  constructor() {
    super(...arguments);
  }
  
  render() {
    return <Slider {...this.props} value={this.state.value} onSlide={this.onChangeValue} />;
  }

}

module.exports = SliderFilter;

