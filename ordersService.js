const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const rawFile = path.join(__dirname, 'data', 'ordersRaw.json');
const processedFile = path.join(__dirname, 'data', 'ordersProcessed.json');

const url = process.env.API_URL;
const baseOptions = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': process.env.API_KEY
  }
};

async function fetchOrders() {
  let allOrders = [];
  let currentPage = 0;
  let totalPages = 1; 

  while (currentPage < totalPages) {
    const options = {
      ...baseOptions,
      body: JSON.stringify({
        params: {
          ordersStatuses: [
            'new', 'finished', 'false', 'lost', 'on_order', 'packed', 'ready',
            'canceled', 'payment_waiting', 'delivery_waiting', 'suspended', 'joined', 'finished_ext'
          ],
          resultsPage: currentPage
        }
      })
    };

    try {
      const res = await fetch(url, options);
      const json = await res.json();

      if (Array.isArray(json.Results)) {
        allOrders = allOrders.concat(json.Results);
      }

      if (currentPage === 0 && json.resultsNumberPage !== undefined) {
        totalPages = json.resultsNumberPage;
      }

      currentPage++;
    } catch (error) {
      break;
    }
  }

  fs.writeFileSync(rawFile, JSON.stringify({ Results: allOrders }, null, 2));
}

function processOrders() {
  if (!fs.existsSync(rawFile)) return;
  const rawData = JSON.parse(fs.readFileSync(rawFile));
  const orders = (rawData.Results || []).map(order => {
    const orderID = order.orderId;
    const orderWorth = order.orderDetails?.payments?.orderCurrency?.orderProductsCost || 0;
    const products = (order.orderDetails?.productsResults || []).map(p => ({
      productID: p.productId,
      quantity: p.productQuantity
    }));
    return { orderID, products, orderWorth };
  });
  fs.writeFileSync(processedFile, JSON.stringify(orders, null, 2));
}

function getAllProcessedOrders() {
  if (!fs.existsSync(processedFile)) return [];
  return JSON.parse(fs.readFileSync(processedFile));
}

function getOrderById(id) {
  const orders = getAllProcessedOrders();
  return orders.find(o => o.orderID === id);
}

module.exports = {
  fetchOrders,
  processOrders,
  getAllProcessedOrders,
  getOrderById
}