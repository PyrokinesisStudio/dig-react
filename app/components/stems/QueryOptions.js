import React      from 'react';

import { License,
         BPM,
         Sort   } from '../filters';

import { QueryOptionsPanel,
         OptionsWrap }      from '../filters/QueryOptions';

class StemsQueryOptions extends React.Component
{
  render() {
    
    const { store } = this.props;

    return (
      <QueryOptionsPanel store={store} >
        <OptionsWrap>
          <li><License store={store} /></li>
          <li><Sort store={store} /></li>
          <li><BPM.Display store={store} /></li>
          <li><BPM.Slider store={store} /></li>
        </OptionsWrap>
      </QueryOptionsPanel>
    );
  }
}

module.exports = StemsQueryOptions;

//