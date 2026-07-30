const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/omeetso').then(async () => {
  const result = await mongoose.connection.collection('stores').find({}, { projection: { name: 1, status: 1 } }).toArray();
  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
