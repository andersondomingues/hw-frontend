// import {} as google from 'googlemaps';

import style from './truckpage.module.scss';

import {
   useEffect, useRef, useState,
} from 'react';

import GoogleMapReact from 'google-map-react';
import LoadingBar, { LoadingBarRef } from 'react-top-loading-bar';
import { AxiosResponse } from 'axios';


import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Navigator } from '../../components/Navigator';
import { FormPage } from '../../components/FormPage';
import { api } from '../../services/api';

interface WarehouseItem {
  id : number;
  description: string;
  currentLocation: string;
}



export function TruckPage() {
  const WAREHOUSE_OPTION_PLACEHOLDER = '-- selected warehouse--';
  const [locations, setLocations] = useState<string[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [truckItems, setTruckItems] = useState<WarehouseItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(WAREHOUSE_OPTION_PLACEHOLDER);

  const ref = useRef<LoadingBarRef>(null);

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
  }, []);

  const selectedWarehouseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    
    const SWITCHING_WAREHOUSES_MESSAGE 
      = 'Switching between warehouses will unload truck item. Are you sure?';

    if(truckItems.length == 0 || confirm(SWITCHING_WAREHOUSES_MESSAGE)){
      setTruckItems([])
      setSelectedWarehouse(event.target.value);
      lookupItems(event.target.value);
    }

    event.preventDefault();
  }

  const lookupItems = (warehouse: string) => {
    if(warehouse != WAREHOUSE_OPTION_PLACEHOLDER){
      const data = {
        location : warehouse
      };

      const response: Promise<AxiosResponse<any, any>> = api.post('packages/get/byLocation', data);

      response.then((resolved) => {
        console.log(resolved.data);
        const items: WarehouseItem[] = resolved.data;
        setWarehouseItems(items.sort((a, b) => a.id - b.id));
      });
    }
  }

  const selectDestinationsClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {

  }

  const clearTruckClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setTruckItems([]);
    event.preventDefault();
  }

  const removeFromTruck = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, item: WarehouseItem) => {
    setTruckItems(truckItems.filter((x) => x != item))
    event.preventDefault();
  }  

  const addToTruck = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, x: WarehouseItem) => {

    if(!truckItems.find(a => a == x)){
      setTruckItems([...truckItems, x]);
    } else {
      alert("Select item has been added to the truck already");
    }

    event.preventDefault();
  } 

  const handleApiLoaded = (map: any, maps: any) => {
    console.log(map)
    console.log(maps)

    var myLatlng = new google.maps.LatLng(-25.363882,131.044922);
   
    // var map = new google.maps.Map(document.getElementById("map"), mapOptions);

    var marker = new google.maps.Marker({
        position: myLatlng,
        title:"Hello World!"
    });

    // To add the marker to the map, call setMap();
    marker.setMap(map);

    //getDirections
    const response: Promise<AxiosResponse<any, any>> = api.get('location/route/get', {} );
    
    response.then((resolved) => {
      console.log(resolved.data);
    });
  }

  return (
    <div>
      <LoadingBar color="#f11946" ref={ref} />
      <Header />
      <Navigator />
      <FormPage>
        <br />
        <form>
          <h1>Truck</h1>
          <div className={style.outterContainer}>
            <div className={style.leftColumn}>
              <div className={style.truckControls}>
                <label>Select departure warehouse
                  <select value={selectedWarehouse} onChange={selectedWarehouseChange}>
                    <option value={WAREHOUSE_OPTION_PLACEHOLDER}>{WAREHOUSE_OPTION_PLACEHOLDER}</option>
                    { locations.map(x => <option value={x}>{x}</option>) }
                  </select>
                </label>
              </div>
              <hr style={{width:'100%', visibility: 'hidden'}}/>
              {
                (selectedWarehouse == WAREHOUSE_OPTION_PLACEHOLDER) 
                  ? <div className={style.instructionMessage}>Select a warehouse location from above to display its items here.</div>
                  : ( (warehouseItems.length == 0) 
                      ? <div className={style.instructionMessage}>Selected warehouse has no items in stock.</div>
                      : (
                          <table className={style.warehouseItemsTable}>
                            <tbody>
                              {warehouseItems.map(x => 
                                <tr>
                                  <td><b>#{x.id}</b>&nbsp;{x.description}</td>
                                  <td style={{width:'10px'}}>
                                    <button onClick={(event) => addToTruck(event, x)}>&gt;&gt;</button>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        )
                    )
              }
            </div>
            <div className={style.rightColumn}>
              { (truckItems.length > 0)  &&
                <div className={style.truckControls}>
                  <label style={{float: 'left'}}>
                    <button onClick={clearTruckClick}>Clear truck</button>
                  </label>
                  <label style={{float: 'left'}}>
                    <button onClick={selectDestinationsClick}>Select destinations</button>
                  </label>
                </div>
              }
              { (truckItems.length == 0) 
                  ? <div className={style.instructionMessage}>Items added to the truck will appear here.</div>
                  : <table className={style.truckItemsTable}>
                      <tbody>
                      { truckItems.map((x, index) => (
                        <tr>
                          <td><b>#{x.id}</b>&nbsp;{x.description}</td>
                          <td style={{width:'10px'}}>
                            <button onClick={(event) => removeFromTruck(event, x)}>x</button>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
              }              
            </div>
          </div>
          <div className={style.outterContainer}>
            <div style={{ height: '400px', width: '100', borderTop: '1px solid black' }}>
              <GoogleMapReact
                bootstrapURLKeys={{ key: "AIzaSyBo_zEIJkX992SDpVrD4CRkk74ljIXUw7E" }}
                // defaultCenter={defaultProps.center}
                // defaultZoom={defaultProps.zoom}
                yesIWantToUseGoogleMapApiInternals
                defaultCenter={{
                  lat:-25.363882, lng: 131.044922
                }}
                defaultZoom={1}
                zoom={5}
                onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
              >
                {/* <AnyReactComponent
                  lat={59.955413}
                  lng={30.337844}
                  text="My Marker"
                /> */}
              </GoogleMapReact>
            </div>
          </div>
        </form>
        <br />
      </FormPage>
      <Footer />
    </div>
  );
}
