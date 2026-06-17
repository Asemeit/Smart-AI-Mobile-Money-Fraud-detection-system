import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    txnId: { type: String, required: true, unique: true },
    provider: { type: String, required: true },
    amount: { type: Number, required: true },
    sender: { type: String, default: 'Unknown' },
    status: {
      type: String,
      enum: ['verified', 'flagged', 'pending'],
      default: 'pending',
    },
    riskScore: { type: Number, default: 0 },
    messageText: String,
    verdict: String,
    flags: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
