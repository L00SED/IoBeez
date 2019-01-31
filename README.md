NETBEEZ
-------
Code Challenge #2

Prerequisites: node.js & npm
Versions used:
  Node: v11.6.0
  NPM: 6.5.0-next.0

Installation instructions:
https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

Checking npm and Node.js versions:
node -v
npm -v

After setting up npm and Node.js, navigate to the IoBeez project directory. In that directory (with package.json) run:
npm start

This will run: nodeman server.js

You should then see the application serving on port 1337
You can view the "dashboard.html" frontend by navigating to:

http://localhost:1337/dashboard.html

The data generation might take a second to start, but you should soon see the charts scrolling in from the right.
I used d3.js and cubism.v1.js, as well as websockets for streaming data to the application.
This is just a rough outline of the visualization. Unfortunately I'm packing up for the move to Pittsburgh; but I would have liked to include some icons each different data type.
Additionally, I think it'd be interesting to embed the data in a floor plan to reflect different temperatures or motion activations within disparate rooms.
