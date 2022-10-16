import './storagepage.module.scss';

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

interface StorageItemData {
  id: number;
  description: string;
  location: string;
}

export function StoragePage() {

  const [storageItems, setStorageItems] = useState<StorageItemData[]>([]);

  const ref = useRef<LoadingBarRef>(null);

  const history = useHistory();

  useEffect(() => {
    const getStorageItems = async () => {
      const data = {};

      const response: Promise<AxiosResponse<any, any>> = api.get('packages/get', data);
      response.then((resolved) => {
        const items: StorageItemData[] = resolved.data;
        setStorageItems(items);       
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
          { storageItems.map(x => <StorageItem data={x} />) } 
        </form>
        <br />
      </FormPage>
      <Footer />
    </div>
  );
}
