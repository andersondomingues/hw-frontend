import style from './storagepage.module.scss';

import { useHistory } from 'react-router-dom';
import {
  ChangeEvent, useEffect, useRef, useState,
} from 'react';
import LoadingBar, { LoadingBarRef } from 'react-top-loading-bar';
import { AxiosResponse } from 'axios';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Navigator } from '../../components/Navigator';
import { FormPage } from '../../components/FormPage';
import { api } from '../../services/api';
import { LoadingIcon } from '../../components/LoadingIcon';
import { StorageItem } from '../../components/StorageItem';


interface StorageItemHistoryEntry {
  timestamp: string;
  location: string;
}

interface StorageItemData {
  id: number;
  description: string;
  location: string;
  history: StorageItemHistoryEntry[]
}

export function StoragePage() {

  const [storageItems, setStorageItems] = useState<StorageItemData[]>([]);

  const ref = useRef<LoadingBarRef>(null);

  useEffect(() => {
    const getStorageItems = async () => {
      const data = {};

      const response: Promise<AxiosResponse<any, any>> = api.get('packages/get', data);
      response.then((resolved) => {
        const items: StorageItemData[] = resolved.data;
        setStorageItems(items);       
        
        console.log(items)
        return items;
      });
    };

    getStorageItems();
  }, []);

  return (
    <div>
      <LoadingBar color="#f11946" ref={ref} />
      <Header />
      <Navigator />
      <FormPage>
        <br />
        <form>
          <h1>Storage</h1>
          <LoadingIcon active={(storageItems.length === 0)} />
          {
            storageItems.length == 0 || 
            <div className={style.outterContainer}>
              <table className={style.warehouseItemsTable}>
                <thead>
                  <tr className={style.tableHeader}>
                    <th>Item</th><th>Current Location</th><th>History</th>
                  </tr>
                </thead>
                <tbody>
                { storageItems.map(x => 
                  <tr key={x.id}>
                    <td><b>#{x.id}</b>&nbsp;{x.description}</td>
                    <td>{x.location}</td>
                    <td>{x.history.map(k => { 
                      return <span>{`${k.location}, ${k.timestamp.replace('T', ' ').replace(/\..+/, '')}`}</span>
                    })}
                    </td>
                    <td>
                      <button>x</button>
                    </td>
                  </tr>  
                )}
                </tbody>
              </table>
            </div>
          }
          
        </form>
        <br />
      </FormPage>
      <Footer />
    </div>
  );
}
