import { NavLink } from 'react-router-dom';
import style from './header.module.scss';

const Header = () => (
  <div className={style.header}>
    <NavLink exact activeClassName={style.linkActive} to="/">
      <h1 className={style.headerName}>Jack&apos;s Warehouse</h1>
    </NavLink>
  </div>
);

export { Header };
