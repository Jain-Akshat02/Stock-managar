import mongoose from "mongoose";

const stockSchema = mongoose.Schema({
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    variants:[
        {
            size: { type: String, required: true },
            quantity: { type: Number, required: true },
        }
    ],
    status: {
        type: String,
        required: false
    }
});

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);
export default Stock; 