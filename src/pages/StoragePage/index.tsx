import style from './storagepage.module.scss';

import { useHistory } from 'react-router-dom';
import React, {
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

  const WAREHOUSE_OPTION_PLACEHOLDER = '-- choose warehouse--';

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(WAREHOUSE_OPTION_PLACEHOLDER);
  const [storageItems, setStorageItems] = useState<StorageItemData[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [itemDescription, setItemDescription] = useState<string>("");

  const ref = useRef<LoadingBarRef>(null);


  const getStorageItems = async () => {
    const data = {};

    const response: Promise<AxiosResponse<any, any>> = api.get('packages/get', data);
    response.then((resolved) => {
      const items: StorageItemData[] = resolved.data;
      setStorageItems(items);
      return items;
    });
  };

  useEffect(() => {
    const getLocations = async () => {
      const data = {};

      const response: Promise<AxiosResponse<any, any>> = api.get('location/get', data);

      response.then((resolved) => {
        const items: string[] = resolved.data;
        setLocations(items.sort((a, b) => a.localeCompare(b)));
      });
    };    

    getLocations();
    getStorageItems();
  }, []);

  const itemDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setItemDescription(event.target.value)
  }
    
  const selectedWarehouseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.preventDefault();
    setSelectedWarehouse(event.target.value);
  }

  const removeItemClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, index: number) => {
    
    event.preventDefault();

    if(confirm('Removing an item from the storage will delete its whole historic. Are you sure?')){ 
      
      const data = { index };
      const response: Promise<AxiosResponse<any, any>> = api.post('packages/delete', data);

      response.then((resolved) => {
        if(resolved.status == 200) { //succefully deleted
          getStorageItems();
        } else {
          alert(`Unable to remove item with index ${index} from the storage.`)
        }
      });
      
    }
    
  }

  const addItemClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
 
    const UNABLE_MSG = "Unable to add item to storage.";  
    const UNABLE_TO_CONTACT_SERVER = "Unable to contact the server";

    const data = { 
      description: itemDescription,
      location: selectedWarehouse
    };

    try {
      const response: Promise<AxiosResponse<any, any>> = api.post('packages/insert', data);
      response.then((resolved) => {
        if(resolved.status == 200) { //succefully deleted

          try{
            const {id, description} = resolved.data;
            getStorageItems(); 
          } catch (e) {
            alert(`${UNABLE_MSG}. ${e}.`);
          }
        } else {
          alert(`${UNABLE_MSG}. Unknown error.`);
        }
      });
    } catch (e) {
      alert(UNABLE_TO_CONTACT_SERVER);
    }
  }

  return (
    <div>
      <LoadingBar color="#f11946" ref={ref} />
      <Header />
      <Navigator />
      <FormPage>
        <br />
        <form>
          <h1>Add New Items</h1>
          <div className={style.truckControls}>
            <label>Item name: 
              <input type="text" value={itemDescription} onChange={itemDescriptionChange}/>
            </label>
            <label style={{marginLeft:'3px'}}>
              Warehouse:
              <select value={selectedWarehouse} onChange={selectedWarehouseChange}>
                <option value={WAREHOUSE_OPTION_PLACEHOLDER}>{WAREHOUSE_OPTION_PLACEHOLDER}</option>
                { locations.map(x => <option key={x} value={x}>{x}</option>) }
              </select>
            </label>
            <label>&nbsp;<br />
              <button onClick={addItemClick}>Add Item</button>
            </label>
          </div>
          <h1>Storage Items</h1>
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
                      return <span key={k.timestamp}>{`${k.location}, ${k.timestamp.replace('T', ' ').replace(/\..+/, '')}`}</span>
                    })}
                    </td>
                    <td>
                      <button onClick={(event) => removeItemClick(event, x.id)}>x</button>
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
