# hw-frontend

This is the frontend part of my implementation of the Jack's Warehouse system. The following technologies were employed:  

* Node (https://nodejs.org/en/)
* ReactJS (https://reactjs.org/)
* Typescript (https://www.typescriptlang.org/)
* SCSS (through modules, SASS - https://sass-lang.com/)

How to run:

* Create a `.env` file at the root folder of the project.
* Make sure that port http/3000 is available. Otherwise, you can change the application port by modifying the `.env` file with the following entry `REACT_APP_PORT=3000`, replacing the parameter value for the target port.
* Modify the `.env` to point to the backend location using the react `REACT_APP_BACKEND_URL` parameter. Defaults to `REACT_APP_BACKEND_URL=http://localhost:4000`
* Set the `REACT_APP_API_GOOGLE_KEY` variable in the `.env` file, required to use maps API. E.g. `REACT_APP_API_GOOGLE_KEY=AIfakeD0keydffakeYckeyTfakeOArkeyvVv9Ps`

After setting up the `.env` file, run the following commands from the root folder:
* `npm install`
* `npm run dev`

The application server should start and the home page will be displayed in the browser. If the browser don't start automatically, navigate to http://localhost:PORT, replacing PORT with the port number in your `.env`file.
