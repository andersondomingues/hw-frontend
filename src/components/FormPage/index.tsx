import { ReactNode } from 'react';
import style from './formpage.module.scss';

interface Props {
  children: ReactNode;
}

const FormPage = ({ children }: Props) => (
  <div className={style.formarea}>{children}</div>
);

export { FormPage };
