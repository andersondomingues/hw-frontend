import { NavLink, useHistory } from 'react-router-dom';
import style from './navigator.module.scss';

const Navigator = () => {
  return (
    <nav className={style.navigator}>
      <ul>
        <li>
          <NavLink exact activeClassName={style.linkActive} to="/">Home</NavLink>
          <NavLink exact activeClassName={style.linkActive} to="/storage">Storage</NavLink>
          <NavLink exact activeClassName={style.linkActive} to="/truck">Truck</NavLink>
        </li>
      </ul>
    </nav>
  );
};

export { Navigator };
