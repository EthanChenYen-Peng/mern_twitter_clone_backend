const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  userName: {
    type: String,
    required: [true, 'Please add a user name'],
    unique: [true, 'Username is unique'],
  },
  email: {
    type: String,
    required: [true, 'Please add a email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 5,
    select: false,
  },
  avatar: {
    type: String,
  },
  coverImage: {
    type: String,
  },
  likedTweets: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Tweet',
    },
  ],
  follows: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
  ],
  followedBy: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
  ],
},
{
  timestamps: true,
  // Load computed properties as well when sending as JSON back to the client
  toJSON: { virtuals: true },
});

userSchema.virtual('avatarUrl').get(function () {
  if (!this.avatar) {
    return '';
  }
  if (this.avatar.startsWith('http')) {
    return this.avatar;
  }
  return this.avatar;

  // return `${process.env.APP_URL}/${this.avatar}`;
});
userSchema.virtual('coverImageUrl').get(function () {
  if (!this.coverImage) {
    return '';
  }
  if (this.coverImage.startsWith('http')) {
    return this.coverImage;
  }
  return this.avatar;

  // return `${process.env.APP_URL}/${this.coverImage}`;
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  } else {
    next();
  }
});

userSchema.methods.toggleLike = async function (tweetId) {
  if (this.likedTweets.includes(tweetId)) {
    this.likedTweets = this.likedTweets.filter((id) => id.toString() !== tweetId._id.toString());
  } else {
    this.likedTweets.push(tweetId);
  }
  await this.save();
};

userSchema.methods.toggleFollow = async function (userId) {
  let action;
  if (this.follows.includes(userId)) {
    this.follows = this.follows.filter((user) => user._id.toString() !== userId.toString());
    action = 'unfollow';
  } else {
    this.follows.push(userId);
    action = 'follow';
  }
  await this.save();
  return action;
};
userSchema.methods.toggleFollowedBy = async function (userId) {
  if (this.followedBy.includes(userId)) {
    this.followedBy = this.followedBy.filter((user) => user._id.toString() !== userId.toString());
  } else {
    this.followedBy.push(userId);
  }
  await this.save();
};

userSchema.methods.matchPassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

userSchema.methods.getJwtToken = function () {
  const payload = { userId: this._id };
  const token = jwt.sign(payload, process.env.JWT_SECRECT, {
    expiresIn: '1h',
  });
  return token;
};
module.exports = mongoose.model('User', userSchema);
