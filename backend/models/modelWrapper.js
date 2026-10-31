const mongoose = require('mongoose');

/**
 * Wraps a Mongoose model with an in-memory mock fallback.
 * - When MongoDB Atlas is connected (readyState === 1), all operations go to MongoDB Atlas.
 * - When MongoDB Atlas is disconnected (readyState !== 1), operations seamlessly execute against the in-memory store.
 */
function wrapModel(realModel, mockModel) {
  return new Proxy(realModel, {
    get(target, prop, receiver) {
      if (mongoose.connection.readyState === 1) {
        const val = Reflect.get(target, prop, receiver);
        return typeof val === 'function' ? val.bind(target) : val;
      }

      if (prop in mockModel) {
        const val = mockModel[prop];
        return typeof val === 'function' ? val.bind(mockModel) : val;
      }

      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
}

module.exports = { wrapModel };
