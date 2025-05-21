const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../data/sales-data.json');
const loadData = () => {
  try {
    const rawData = fs.readFileSync(dataFile);
    return JSON.parse(rawData);
  } catch (error) {
    return { salesData: [], insights: {} };
  }
};
const saveData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

exports.getSales = (req, res) => {
  const { startDate, endDate } = req.query;
  const data = loadData();

  if (!startDate || !endDate) {
    return res.status(200).json(data.salesData);
  }

  const filteredData = data.salesData.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
  });

  return res.status(200).json(filteredData);
};

exports.addSale = (req, res) => {
  const data = loadData();
  const newSale = req.body;
  data.salesData.push(newSale);
  saveData(data);
  res.status(201).json(newSale);
}; 