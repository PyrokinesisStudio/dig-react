import React        from 'react';
import Property     from '../../models/properties/bpm';
import Input        from './controls/input';

function BPMProperty(props) {
  return <Input.Toggle store={props.store} property={Property} />;
}

module.exports = BPMProperty;

//