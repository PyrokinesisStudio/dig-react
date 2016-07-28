import Eventer from '../services/eventer';
import events  from './events';

class YeOldWatchableJavascriptProperty extends Eventer 
{
  constructor() {
    super();
    this._value        = undefined;
    this._propName     = '_unnamed_';
    this._displayName  = '_Un-Named_';
  }

  static deserialize( hash, Class ) {
    const instance = new Class();
    instance.deserialize(hash[instance.name]);
    return instance;
  }

  get displayName() {
    return this._displayName;
  }

  get name() {
    return this._propName;
  }
  
  /*
      The static display value
  */
  get value() {
    return this._value;
  }

  set value(val) {
    if( val !== this._value ) {
      this._value = val;
      this.onChange();
    }
  }

  /*
    The editable version

    The default implementation presents 'live' updates - i.e. every
    time the value changes, notifications go out.

    UI widgets are expected to update only the 'editable' property
    (should probably make 'value' RO  to enforce this ??).

    Derived classes can separate out what gets edited when the
    display value is calcuated (e.g. display HTML, edit bbCode)

    NOTE that change notification will be done when the editable
    value has changed so sinks should check to see if serialized
    version of the property has actually changed before commiting
    to stores.

  */
  set editable(val) {
    this.value = val;
  }

  get editable() {
    return this._value;
  }
  
  /*
    The persistant version. 

    Instantiate ths value from store
  */
  deserialize(nativeValue) {
    this.value = nativeValue;
  }

  /*
    Returns a value that makes it possible to
    deserialize() later.

    context is derivation specific - it may be
    some kind of container that caller expects
    the value to be put in (like a TagString)
    
  */
  serialize( /* context */ ) {
    return this.value;
  }

  /*
    N.B. Events may be triggered when EITHER the
         'value' or the 'editable' has changed.

    N.B. Nested emits are muzzled so setting either
         value or editable during an onChange handler
         will not send out another notification.

  */
  onChange(listener) {
    if( typeof listener === 'undefined') {
      if( !this._suppressEvents ) {
        this._suppressEvents = true;
        this.emit( events.PROPERTY_CHANGED, this );
        this._suppressEvents = false;
      }
    } else {
      this.on( events.PROPERTY_CHANGED, listener );
    }
    return this;
  }

  removeChangeListener(listener) {
    this.removeListener( events.PROPERTY_CHANGED, listener );
  }

}


module.exports = YeOldWatchableJavascriptProperty;