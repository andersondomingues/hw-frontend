import style from './truckpage.module.scss';
import { decode } from "@googlemaps/polyline-codec";
import { useEffect, useRef, useState } from 'react';
import GoogleMapReact from 'google-map-react';
import LoadingBar, { LoadingBarRef } from 'react-top-loading-bar';
import { AxiosResponse } from 'axios';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Navigator } from '../../components/Navigator';
import { FormPage } from '../../components/FormPage';
import { api } from '../../services/api';
import { STATUS_CODES } from 'http';

interface WarehouseItem {
  id : number;
  description: string;
  currentLocation: string;
}


export function TruckPage() {

  const WAREHOUSE_OPTION_PLACEHOLDER = '-- selected warehouse--';

  const MAP_CENTER_COORDINATES =  // center to US coodinates
    { lat: 34.6169114, lng: -106.3333745 }; 

  // store warehouse locations, used in dropdown menus
  const [locations, setLocations] = useState<string[]>([]);

  // item stored in the selected warehouse
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);

  // item added to the truck
  const [truckItems, setTruckItems] = useState<WarehouseItem[]>([]);

  // toggle displaying destination and map sections
  const [displaySelectDestination, setDisplaySelectDestination] = useState<string>('none');
  // const [displayMap, setDisplayMap] = useState<string>('none');

  // currently selected warehouse
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(WAREHOUSE_OPTION_PLACEHOLDER);

  // destinations to calculate routes from 
  const [destinations, setDestinations] = useState<string[]>([]);

  // ref object for the loading bar (upper border)
  const ref = useRef<LoadingBarRef>(null);

  // polylines currently draw to the map
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  // google map
  const [map, setMap] = useState<any>(null);
  const [maps, setMaps] = useState<any>(null);

  // load locations at page startup
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

  // triggered when changing the value of the selected warehouse dropbox
  const selectedWarehouseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.preventDefault();
    const SWITCHING_WAREHOUSES_MESSAGE
      = 'Switching between warehouses will unload truck item. Are you sure?';

    if(truckItems.length == 0 || confirm(SWITCHING_WAREHOUSES_MESSAGE)){
      setTruckItems([])
      setSelectedWarehouse(event.target.value);
      lookupItems(event.target.value);
    }    
  }

  // call backend to retrieve items of the selected warehouse
  const lookupItems = (warehouse: string) => {
    if(warehouse != WAREHOUSE_OPTION_PLACEHOLDER){
      const data = {
        location : warehouse
      };

      const response: Promise<AxiosResponse<any, any>> = api.post('packages/get/byLocation', data);

      response.then((resolved) => {
        const items: WarehouseItem[] = resolved.data;
        setWarehouseItems(items.sort((a, b) => a.id - b.id));
      });
    }
  }

  // advance to the select destinations block
  const selectDestinationsClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    ref!.current!.continuousStart(0, 20);
    setDisplaySelectDestination('block');
    setDestinations([])
    ref!.current!.complete();
  }

  // remove all items from the truck
  const clearTruckClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ref!.current!.continuousStart(0, 200);
    setTruckItems([]);
    event.preventDefault();
    ref!.current!.complete();
  }

  // remove a single item from the truck
  const removeFromTruck = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, item: WarehouseItem) => {
    event.preventDefault();
    setTruckItems(truckItems.filter((x) => x != item))
  }

  // add an item to the truck, avoiding duplicates
  const addToTruck = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, x: WarehouseItem) => {
    event.preventDefault();
    if(!truckItems.find(a => a == x)){
      setTruckItems([...truckItems, x]);
    } else {
      alert("Selected item has been added to the truck already");
    }    
  }

  // confirm destinations and show map
  const confirmDestinationClick  = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    // setDisplayMap('block');
    displayRoute(selectedWarehouse, destinations);
  }

  // abort destination selection and go back to item selection
  const backToItemSeletion  = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    // setDisplaySelectDestination('none');
    ref!.current!.complete();
  }

  // display route
  const displayRoute = (origin: string, destinations: string[]) => {
    
    // clear current polylines
    for(let i = 0; i < polylines.length; i++){
      const polyline: google.maps.Polyline = polylines[i];
      polyline.setMap(null);
    }

    // const marker = new google.maps.Marker({
    //     position: centerCoordinates,
    //     title:"Hello World!"
    // });

    // // To add the marker to the map, call setMap();
    // marker.setMap(map);


    //getDirections
    const response: Promise<AxiosResponse<any, any>> = api.post('location/route/get', {
      origin, destinations
    });

    // draw waypoints
    response.then((resolved) => {
    
      if(resolved.status != 200) // http ok
        return alert('failed');

      // get single calculated route
      const route = resolved.data.routes[0];

      // map bounds
      const bounds = new google.maps.LatLngBounds();

      console.log(route.legs)

      // iterate leg points
      for (let i = 0; i < route.legs.length; i++){
        const steps = route.legs[i].steps;
        for(let j = 0; j < steps.length; j++){         
          const points = steps[j].polyline.points;
          const polyline = new google.maps.Polyline({
            path: decode(points).map(x => new google.maps.LatLng(x[0], x[1])),
            strokeColor: '#FF0000',
            strokeWeight: 3,
            map: map
          });

          setPolylines([...polylines, polyline]);

          for (let l = 0; l < polyline.getPath().getLength(); l++) {
            bounds.extend(polyline.getPath().getAt(l));
          }         
        }
      } 
      map.fitBounds(bounds);
    });
  }

  // capture maps objects as soon as the map loads
  const handleApiLoaded = (map: any, maps: any) => {
    setMap(map);
    setMaps(maps);
  }

  // adds/removes destinations from the destination list
  const destinationSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const newDestinations = destinations;
    newDestinations[index] = event.target.value;
    setDestinations(newDestinations);
    console.log(newDestinations)
  }

  return (
    <div>
      <LoadingBar color="#336699" ref={ref} />
      <Header />
      <Navigator />
      <FormPage>
        <br />
        <form>
          {/* Departure warehouse selection checkbox and selected warehouse items */}
          <h1>Truck</h1>
          <div className={style.outterContainer}>
            <div className={style.leftColumn}>
              <div className={style.truckControls}>
                <label>Select departure warehouse
                  <select value={selectedWarehouse} onChange={selectedWarehouseChange}>
                    <option value={WAREHOUSE_OPTION_PLACEHOLDER}>{WAREHOUSE_OPTION_PLACEHOLDER}</option>
                    { locations.map(x => <option key={x} value={x}>{x}</option>) }
                  </select>
                </label>
              </div>
              <hr style={{width:'100%', visibility: 'hidden'}}/> { /* css-fix, force flex break */}
              {
                /* Warehouse selection checkbox and selected warehouse items */
                (selectedWarehouse == WAREHOUSE_OPTION_PLACEHOLDER)
                  ? <div className={style.instructionMessage}>Select a warehouse location from above to display its items here.</div>
                  : ( (warehouseItems.length == 0)
                      ? <div className={style.instructionMessage}>Selected warehouse has no items in stock.</div>
                      : (
                          <table className={style.warehouseItemsTable}>
                            <tbody>
                              {warehouseItems.map(x =>
                                <tr key={x.id}>
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
            { /* control for clearing truck and advance to select destinations */}
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
              { /* Item added to the truck*/ }
              { (truckItems.length == 0)
                  ? <div className={style.instructionMessage}>Items added to the truck will appear here.</div>
                  : <table className={style.truckItemsTable}>
                      <tbody>
                      { truckItems.map((x) => (
                        <tr key={x.id}>
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
          { /* Select destination for selected items */}
          <div className={style.outterContainer} style={{display: displaySelectDestination}}>
            <h1>Select Destinations</h1>
            { /* Control for confirming destination and go back to item selection */ }
            <div className={style.truckControls} style={{width: '100%', marginLeft:'10px', marginRight: '10px'}}>
              <label style={{float: 'left'}}>
                <button onClick={backToItemSeletion}>Back to item selection</button>
              </label>
              <label style={{float: 'left'}}>
                <button onClick={confirmDestinationClick}>Confirm Destinations (Send Truck)</button>
              </label>
            </div>

            { /* Destination options */
              <table className={style.truckItemsTable} style={{marginLeft: '10px', marginRight: '10px'}}>
              <tbody>
              { truckItems.map((x, index) => (
                <tr key={x.id}>
                  <td><b>#{x.id}</b>&nbsp;{x.description}</td>
                  <td style={{ width: '30px'}}>
                    <select onChange={(event) => destinationSelectChange(event, index)}>
                      <option value={WAREHOUSE_OPTION_PLACEHOLDER}>{WAREHOUSE_OPTION_PLACEHOLDER}</option>
                      { locations.map(x => <option key={x} value={x}>{x}</option>) }
                    </select>
                  </td>
                </tr>
              ))}
              </tbody>
            </table> }
          </div>
          { /* google maps interface and route displaying */}
          {/* <div className={style.outterContainer} style={{display: displayMap}}> */}
          <div className={style.outterContainer} >
            <div style={{ height: '400px', width: '100', borderTop: '1px solid black' }}>
              <GoogleMapReact
                bootstrapURLKeys={{ key: String(process.env.REACT_APP_API_GOOGLE_KEY) }}
                yesIWantToUseGoogleMapApiInternals
                defaultCenter={MAP_CENTER_COORDINATES}
                defaultZoom={5}
                zoom={5}
                onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)} > 
                { /* Can put react components here. They'll appear over the map, ex.
                <AnyReactComponent lat={59.955413} lng={30.337844} text="My Marker" /> */}
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
