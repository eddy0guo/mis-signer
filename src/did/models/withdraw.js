import mongoose from 'mongoose'
const Schema = mongoose.Schema;

let DataSchema = new Schema({
	network: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
	master_txid: {
        type: String,
        required: true
    },
	child_txid: {
        type: String,
        required: true
    },
	convert_txid: {
        type: String,
        required: true
    },
	master_status: {
        type:String,
        required: true
    },
	child_status: {
        type:String,
        required: true
    },
    convert_status: {
        type:String,
        required: true
    },
   	value: {
        type: Number,
        required: true
    },
	updated_time: {
        type: Date,
        required: true
    },
	created_time: {
        type: Date,
        required: true
    },

});

export default mongoose.model('fingo_withdraw', DataSchema)
