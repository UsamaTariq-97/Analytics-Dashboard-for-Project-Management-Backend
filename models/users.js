const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const e = require('cors');

const userSchema = new mongoose.Schema({

   fullName:{
    type: String,
    required: [true, 'Please add a full name'],
    trim: true
   },
   email:{
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
     match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
   },
   role:{
    type: String,
    enum: ['admin', 'user','moderator'],
    default: 'user'
   },
   password:{
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
   },
   status:{
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
   },

},
 {
    timestamps: true,
  },
);

userSchema.pre('save', async function(){
    if(!this.isModified('password')){
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('user',userSchema);