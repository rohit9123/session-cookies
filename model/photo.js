const mongoose=require("mongoose");
// const { stringify } = require("uuid");
const { schema, model } = require("./user");
const Schema=mongoose.Schema;
const User=require('./user');

const photoSchema=new Schema({
    photo:String,
    desc:String,
    user:{type:Schema.Types.ObjectId,ref:'User'}
})

module.exports=mongoose.model('Photo',photoSchema);

