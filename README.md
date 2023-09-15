
### Requirements

Install `Grenache Grape`: https://github.com/bitfinexcom/grenache-grape:

```bash
npm i -g grenache-grape
```

```
// Start 2 Grapes
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

## Description

A test application using the Grenache library to demonstrate distributed systems. The application randomly generates buy/sell orders and sends them to random client nodes in the network.
THIS IS A POC NOT FULLY WORKING

## Installation

1. Clone the repository
2. Install dependencies:
    ```bash
    npm install
    ```

## Running the Application

Run the application:
```bash
npm start
```
Run the order generator on separate terminal:
```bash
npm run start:generator
```

## Features

- Randomly generates buy/sell orders with a unique ID, quantity, and price.
- Sends generated orders to a randomly selected client node every 5 seconds.

## Dependencies

- `axios`: For HTTP requests
- `uuid`: To generate unique IDs
- `grenache-nodejs-http`: Grenache HTTP transport layer
- `grenache-nodejs-link`: Grenache link layer
