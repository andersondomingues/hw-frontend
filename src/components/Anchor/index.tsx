import { ReactNode } from 'react';
import style from './anchor.module.scss';

interface Props {
  to: string;
  children: ReactNode;
}

const Anchor = ({ children, to }: Props) => (
  <a className={style.anchor} href={to}>
    {children}
  </a>
);

export { Anchor };
