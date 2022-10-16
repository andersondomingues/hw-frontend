import { ReactNode } from 'react';
import style from './footer.module.scss';

interface Props {
  children?: ReactNode;
}

const Footer = ({ children }: Props) => (
  <div className={style.footer}>
    <p className={style.rights}>
      {children}
      Jack Systems&reg;2022. All rights reserved.
    </p>
  </div>
);

export { Footer };
