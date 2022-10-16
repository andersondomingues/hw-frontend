import { ReactNode } from 'react';
import style from './loadingicon.module.scss';
import loadingIcon from '../../assets/images/loadingIcon.gif';

interface Props {
  active: boolean;
}

const LoadingIcon = (props: Props) => {
  const { active } = props;

  const className = active
    ? style.loadingIconEnabled
    : style.loadingIconDisabled;
  return <img src={loadingIcon} className={className} alt="Loading" />;
};

export { LoadingIcon };
