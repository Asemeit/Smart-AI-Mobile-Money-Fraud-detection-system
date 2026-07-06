import mongoose from 'mongoose';

const fraudCheckSchema = new mongoose.Schema(
  {
    checkId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userRef: { type: String, default: null, index: true },
    messageText: { type: String, required: true },
    provider: String,
    documentType: String,
    amount: Number,
    riskScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    verdict: String,
    flags: [String],
    source: { type: String, default: 'rule-engine' },
    parsed: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.FraudCheck || mongoose.model('FraudCheck', fraudCheckSchema);
