import {
  BrowserRouter, Route, Switch,
} from 'react-router-dom';

import { StoragePage } from './pages/StoragePage';
import { HomePage } from './pages/HomePage';
import { TruckPage } from './pages/TruckPage';

import './styles/global.scss';


function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route
          path="/"
          exact
          component={HomePage}
        />
        <Route
          path="/storage"
          exact
          component={StoragePage}
        />
        <Route
          path="/truck"
          exact
          component={TruckPage}
        />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
