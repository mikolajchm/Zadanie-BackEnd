const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'data', 'ordersRaw.json');
const processedFile = path.join(__dirname, 'data', 'ordersProcessed.json');

const url = 'https://zooart6.yourtechnicaldomain.com/api/admin/v5/orders/orders/search';
const options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': 'YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP'
  },
  body: JSON.stringify({
    params: {
      ordersStatuses: [
        'new', 'finished', 'false', 'lost', 'on_order', 'packed', 'ready',
        'canceled', 'payment_waiting', 'delivery_waiting', 'suspended', 'joined', 'finished_ext'
      ]
    }
  })
};

async function fetchOrders() {
  const res = await fetch(url, options);
  const json = await res.json();
  fs.writeFileSync(rawFile, JSON.stringify(json, null, 2));
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