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

interface WarehouseItem {
  id : number;
  description: string;
  currentLocation: string;
}


export function TruckPage() {

  const WAREHOUSE_OPTION_PLACEHOLDER = '-- select warehouse --';
  const UNABLE_TO_GET_ROUTER_MESSAGE = "Could not find a route for the selected warehouses.\
    Either the length of the route is too long or the number of warehouses exceed the limitation (10).";
  const MAP_CENTER_COORDINATES =  // center to US coodinates
    { lat: 34.6169114, lng: -106.3333745 }; 

  // store warehouse locations, used in dropdown menus
  const [locations, setLocations] = useState<string[]>([]);

  // item stored in the selected warehouse
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);

  // item added to the truck
  const [truckItems, setTruckItems] = useState<WarehouseItem[]>([]);

  // currently selected warehouse
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(WAREHOUSE_OPTION_PLACEHOLDER);

  // destinations to calculate routes from 
  const [destinations, setDestinations] = useState<string[]>([]);

  // ref object for the loading bar (upper border)
  const ref = useRef<LoadingBarRef>(null);

  // polylines and markers currently applied to the map
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // google map
  const [map, setMap] = useState<any>(null);
  const [maps, setMaps] = useState<any>(null); // intentionally unused

  // load warehouse locations at page startup
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
      setDestinations([])
      setSelectedWarehouse(event.target.value);
      cleanMapDisplay();
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

  // remove all items from the truck
  const clearTruckClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if(confirm('Clearing the truck will reset any selected destination. Proceed clearing the truck?')){
      setTruckItems([]);
    }
  }

  // remove a single item from the truck
  const removeFromTruck = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, item: WarehouseItem) => {
    event.preventDefault();
    const index = truckItems.indexOf(item);
    setTruckItems(truckItems.filter((x) => x != item));
    setDestinations(destinations.filter((x) => destinations.indexOf(x) != index));
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
  const calculateRouteClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    // remove duplicated locations 
    const filteredDestinations = destinations.filter((value, index, self) => {
      return (self.indexOf(value) === index && value != selectedWarehouse);
    });

    // make sure that all items have destinations set.
    if(filteredDestinations.indexOf(WAREHOUSE_OPTION_PLACEHOLDER) > -1)
      return alert("You must select destinations to all items before proceeding.")

    // google API do not calculate routes for more than 15 waypoints
    try { 
      displayRoute(selectedWarehouse, filteredDestinations);
    } catch (e) { 
      alert(UNABLE_TO_GET_ROUTER_MESSAGE);
      console.log(e)
    }
  }

  const cleanMapDisplay = () => {
        // remove markers and polylines
    // clear current polylines
    for(let i = 0; i < polylines.length; i++){
      const polyline: google.maps.Polyline = polylines[i];
      polyline.setMap(null);
    }
    setPolylines([]);

    // clear pins
    for(let i = 0; i < markers.length; i++){
      const marker: google.maps.Marker = markers[i];
      marker.setMap(null);
    }
    setMarkers([]);
  }

  // display route
  const displayRoute = async (origin: string, destinations: string[]) => {
    
    console.log({origin, destinations})

    cleanMapDisplay();

    if(truckItems.length === 0)
      return alert("Truck is empty! Add items to the truck to calculate a route.");

    try { 
      //getDirections
      const response = await api.post('location/route/get', {
        origin, 
        destinations
      });

      if(response.status != 200) // http ok
        return alert(UNABLE_TO_GET_ROUTER_MESSAGE);

        // get single calculated route
      const route = response.data.routes[0];

      // map bounds
      const bounds = new google.maps.LatLngBounds();

      // new drawing items
      const newPolylines : google.maps.Polyline[] = [];
      const newMarkers : google.maps.Marker[] = [];

      // iterate leg points
      // the last leg correspond to the round trip path
      for (let i = 0; i < route.legs.length -1; i++){
        
        // add polylines to map
        const steps = route.legs[i].steps;
        
        for(let j = 0; j < steps.length; j++){         
          const points = steps[j].polyline.points;
          const polyline = new google.maps.Polyline({
            path: decode(points).map(x => new google.maps.LatLng(x[0], x[1])),
            strokeColor: '#FF0000',
            strokeWeight: 3,
            map: map
          });

          newPolylines.push(polyline);

          // fix visible area of the map (focus in the whole path region)
          for (let l = 0; l < polyline.getPath().getLength(); l++)
            bounds.extend(polyline.getPath().getAt(l));
        }

        // pin source path mark
        const markerOrigin = new google.maps.Marker({
          position: route.legs[i].start_location,
          title: `Warehouse: ${route.legs[i].start_address}`
        });

        markerOrigin.setMap(map);
        newMarkers.push(markerOrigin);    

        // pin destination path mark
        const markerDestination = new google.maps.Marker({
          position: route.legs[i].end_location,
          title: `Warehouse: ${route.legs[i].end_address}`
        });

        markerDestination.setMap(map);
        newMarkers.push(markerDestination);
        
        setMarkers(newMarkers)
        setPolylines(newPolylines);
        map.fitBounds(bounds);
      }

    } catch (e) { 
      alert(UNABLE_TO_GET_ROUTER_MESSAGE);
      console.log(e);
    }      
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
          <h1>Departure Warehouse</h1>
          <div className={style.outterContainer}>
            <div className={style.truckControls}>
              <label>Select departure warehouse
                <select value={selectedWarehouse} onChange={selectedWarehouseChange}>
                  <option value={WAREHOUSE_OPTION_PLACEHOLDER}>{WAREHOUSE_OPTION_PLACEHOLDER}</option>
                  { locations.map(x => <option key={x} value={x}>{x}</option>) }
                </select>
              </label>
            </div>
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
          { /* Select destination for selected items */}
          <h1>Select Destinations</h1>
          <div className={style.outterContainer}>
            { /* Control for confirming destination and go back to item selection */ }
            <div className={style.truckControls}>
              <button onClick={clearTruckClick}>Clear truck</button>&nbsp;
              <button onClick={calculateRouteClick}>Calculate route</button>
            </div>

            { /* Destination options */
              (truckItems.length == 0)
              ? <div className={style.instructionMessage}>Items added to the truck will appear here.</div>
              : <table className={style.truckItemsTable}>
              <tbody>
              { truckItems.map((x, index) => (
                <tr key={x.id}>
                  <td><b>#{x.id}</b>&nbsp;{x.description}</td>
                  <td style={{ width: '30px'}}>
                    <select onChange={(event) => destinationSelectChange(event, index)}>
                      <option value={WAREHOUSE_OPTION_PLACEHOLDER}>{WAREHOUSE_OPTION_PLACEHOLDER}</option>
                      { locations
                          .filter(x => x != selectedWarehouse)
                          .map(x => <option key={x} value={x}>{x}</option>) }
                    </select>
                  </td>
                  <td className={style.buttonCell}>
                    <button onClick={(event) => removeFromTruck(event, x)}>x</button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table> }
          </div>
          { /* google maps interface and route displaying */}
          <h1>Route Visualization (round trip)</h1>
          <div className={style.outterContainer} >
            <div style={{ height: '400px', width: '100', borderTop: '1px solid black' }}>
              <GoogleMapReact
                bootstrapURLKeys={{ key: String(process.env.REACT_APP_API_GOOGLE_KEY) }}
                yesIWantToUseGoogleMapApiInternals
                defaultCenter={MAP_CENTER_COORDINATES}
                defaultZoom={5}
                zoom={5}
                onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)} > 
                { /* Can render react components here. They'll appear over the map at
                the desired coordinate, ex.
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
