import React         from 'react';
import Glyph         from '../vanilla/Glyph';
import DeadLink      from '../vanilla/DeadLink';
import DropdownMenu  from '../vanilla/DropdownMenu';
import FeedBadge     from './FeedBadge';
import { ellipse }   from '../../unicorns';
import thumbStyle    from '../services/people-thumb-style';

const MAX_NAME_LEN = 15;

function MenuDivider() {
  return (<li className="divider"></li>);
}

const CurrentUserMenu = React.createClass({

  getInitialState() {
    return { loading: this.props.loading };
  },

  componentWillReceiveProps(props) {
    this.setState(props);
  },

  render() {

    const { loading, model:user } = this.state;

    if( loading) {
      return null;
    }

    const { onLogin, feedbadge } = this.props;

    if( !user ) {
      return (<li><DeadLink id="user-menu" onClick={onLogin}><Glyph icon="user" />{" log in"}</DeadLink></li>);
    }

    const { name } = user;

    var children = React.Children.map( this.props.children, c => c.type.name === 'MenuDivider' ? c : <li>{c}</li> );

    var head = <span>{ellipse(name,MAX_NAME_LEN)}{" "}{feedbadge && <FeedBadge />}</span>;

    return (
      <DropdownMenu id="user-menu" style={thumbStyle(user)} head={head}>
        {children}
      </DropdownMenu>
    );
  }

});

CurrentUserMenu.Divider = MenuDivider;

module.exports = CurrentUserMenu;


//