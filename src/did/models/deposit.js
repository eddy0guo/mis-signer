import mongoose from 'mongoose'
const Schema = mongoose.Schema;

let DataSchema = new Schema({
    txid: String,
	chain: {
        type: String,
        required: true
    },
	network: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    asim_address: {
        type: String,
        required: true
    },
    asim_tx: {
        type: String,
        required: true
    },
    status: {
        type:String,
        required: true
    },
	created_time: {
        type: Date,
        required: true
    },
});

export default mongoose.model('Deposit', DataSchema)
