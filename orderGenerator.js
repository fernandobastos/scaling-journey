const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
// Function to generate random integer between min and max
const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Function to generate a random order
const generateRandomOrder = () => {
  return {
    order: {
      id: uuidv4(),
      type: getRandomInt(0, 1) === 0 ? "buy" : "sell",
      quantity: getRandomInt(1, 100),
      price: getRandomInt(10, 100),
      timestamp: Date.now(), // Added timestamp
    },
    action: "processOrder",
  };
};

// List of client node ports
const clientNodePorts = [5001, 5002];

// Function to send random orders to random client nodes
const sendRandomOrderToRandomNode = () => {
  console.log("sending order");
  const randomOrder = generateRandomOrder();
  const randomNodePort =
    clientNodePorts[getRandomInt(0, clientNodePorts.length - 1)];

  axios
    .post(`http://127.0.0.1:${randomNodePort}`, [null, null, randomOrder], {
      headers: { _a: "processOrder" },
    })
    .then((response) => {
      console.log(`Order sent to node ${randomNodePort}:`, response);
    })
    .catch((error) => {
      console.log("Error sending order:", error);
    });
};

// Send a random order every 10 seconds
setInterval(sendRandomOrderToRandomNode, 10000);
