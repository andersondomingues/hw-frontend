import { NavLink, useHistory } from 'react-router-dom';
import style from './storageitem.module.scss';

interface StorageItemData {
  id: number;
  description: string;
  location: string;
}

interface Props {
  data: StorageItemData;
}

const StorageItem = (props: Props) => {
  const {
    id, description, location
  } = props.data;

  const handleClickDetalhes = () => {
  };

  return (
    <div className={style.listaProjetoItemClass}>
      <table>
        <tbody>
          <tr>
            <td style={{ width: '50px' }}>
              <span>Code</span>
              <br />
              #
              {id}
            </td>
            <td style={{ width: '150px' }}>
              <span>Description</span>
              <br />
              {(description.length === 0) ? '- -' : description}
            </td>
            <td>
              <span>Location (warehouse)</span>
              <br />
              {(location) || '- -'}
            </td>
            <td style={{ width: '30px' }}>
              <button type="button" style={{ display: 'table-cell' }} onClick={handleClickDetalhes}>+1</button>
            </td>
            <td style={{ width: '30px' }}>
              <button type="button" style={{ display: 'table-cell' }} onClick={handleClickDetalhes}>-1</button>
            </td>
            <td style={{ width: '30px' }}>
              <button type="button" style={{ display: 'table-cell' }} onClick={handleClickDetalhes}>X</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export { StorageItem };
