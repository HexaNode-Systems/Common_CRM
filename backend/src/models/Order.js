import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerInfo: {
      name: String,
      email: String,
      phone: String,
      address: String
    },
    items: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogItem' },
        title: String,
        type: { type: String, enum: ['product', 'service'] },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 }
      }
    ],
    businessType: { type: String, enum: ['product', 'service', 'mixed'], default: 'mixed' },
    status: { type: String, enum: ['new', 'confirmed', 'processing', 'completed', 'cancelled'], default: 'new' },
    total: { type: Number, default: 0 },
    notes: String
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);

