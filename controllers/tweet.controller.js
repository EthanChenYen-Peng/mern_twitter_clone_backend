const Tweet = require('../models/tweet.model');
const User = require('../models/user.model');

// @desc      Get all relevant tweets for authenticated user
// @route     GET /v1/tweets/
// @access    Private
exports.getReleventTweets = async (req, res, next) => {
  try {
    // const tweets = await Tweet.find({ createdBy: req.user._id }, null, { sort: '-updatedAt' }).populate({
    //   path: 'createdBy',
    // });
    const tweets = await Tweet.find(null, null, { sort: '-createdAt' }).populate({
      path: 'createdBy',
    });
    res.status(200).json({ success: true, tweets });
  } catch (error) {
    next(error);
  }
};
// @desc      Get all tweets from a single user
// @route     GET /v1/tweets/:userId/tweets/
// @access    Public
exports.getAllFromUser = async (req, res, next) => {
  try {
    const tweets = await Tweet.find({ createdBy: req.params.userId }, null, { sort: '-createdAt' }).populate('createdBy');
    res.status(200).json({ success: true, tweets });
  } catch (error) {
    next(error);
  }
};
// @desc      Create a single tweet
// @route     POST /v1/tweets/
// @access    Private
exports.createOne = async (req, res, next) => {
  try {
    let tweet = await Tweet.create({ ...req.body, createdBy: req.user._id });
    tweet = await tweet.populate('createdBy').execPopulate();
    res.status(200).json({ success: true, tweet });
  } catch (error) {
    next(error);
  }
};

// @desc      Get a single tweet by ID
// @route     GET /v1/tweets/:id
// @access    Public
exports.getOne = async (req, res, next) => {
  try {
    let tweet = await Tweet.findById(req.params.id);
    tweet = await tweet.populate('createdBy').execPopulate();
    res.status(200).json({ success: true, tweet });
  } catch (error) {
    next(error);
  }
};

// @desc      Update a single tweet by ID
// @route     PATCH /v1/tweets/:id
// @access    Private
exports.updateOne = async (req, res, next) => {
  try {
    let tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).json({ success: false, message: 'Tweet with given id does not exist' });
    }
    if (tweet.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'No authorize for this route' });
    }
    tweet = await Tweet.findByIdAndUpdate(req.params.id, req.body,
      {
        new: true,
        runValidators: true,
      });
    res.status(200).json({ success: true, tweet });
  } catch (error) {
    next(error);
  }
};
// @desc      Delete a single tweet by ID
// @route     Delete /v1/tweets/:id
// @access    Private
exports.deleteOne = async (req, res, next) => {
  try {
    let tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).json({ success: false, message: 'Tweet with given id does not exist' });
    }
    if (tweet.createdBy.toString() !== req.user._id) {
      return res.status(401).json({ success: false, message: 'No authorize for this route' });
    }
    tweet = await Tweet.findByIdAndRemove(req.params.id);
    res.status(200).json({ success: true, tweet });
  } catch (error) {
    next(error);
  }
};

// @desc      Adding comment to a tweet
// @route     POST /v1/tweets/:id/comment
// @access    Private
exports.createComment = async (req, res, next) => {
  try {
    let tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ success: false, message: 'Tweet with given id does not exist' });
    }
    const newComment = { content: req.body.content, createdBy: req.user._id };
    tweet.comments.push(newComment);
    await tweet.save();
    tweet = await tweet.populate({
      path: 'comments',
      populate: { path: 'createdBy' },
    }).execPopulate();

    res.status(200).json({ success: true, count: tweet.comments.length, comment: tweet.comments[tweet.comments.length - 1] });
  } catch (error) {
    next(error);
  }
};

// @desc      Get all comments on a tweet
// @route     GET /v1/tweets/:id/comment
// @access    Public
exports.getAllComments = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id).populate({
      path: 'comments',
      populate: { path: 'createdBy' },
    });
    if (!tweet) {
      return res.status(404).json({ success: false, message: 'Tweet with given id does not exist' });
    }
    res.status(200).json({ success: true, comments: tweet.comments });
  } catch (error) {
    next(error);
  }
};

// @desc      Get all comments
// @route     GET /v1/tweets/user/:userId/comments
// @access    Public
exports.getAllUserComments = async (req, res, next) => {
  try {
    const tweets = await Tweet.find({ 'comments.createdBy': req.params.userId }).populate({
      path: 'comments createdBy',
      populate: { path: 'createdBy' },
    });
    if (!tweets) {
      return res.status(404).json({ success: false, message: 'Tweet with given id does not exist' });
    }
    res.status(200).json({ success: true, tweets });
  } catch (error) {
    next(error);
  }
};

// @desc      User can like a tweet
// @route     POST /v1/tweets/:id/likes
// @access    Private
exports.createLike = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ success: false, message: 'Tweet with given id does not exist' });
    }
    // if (req.user.likedTweets.includes(tweet._id)) {
    //   tweet.likes = tweet.likes.filter((id) => id.toString() !== req.user._id.toString());
    //   await tweet.save();
    //   req.user.likedTweets = req.user.likedTweets.filter((id) => id.toString() !== tweet._id.toString());
    //   await req.user.save();
    //   return res.status(200).json({ success: true, tweet, count: tweet.likes.length });
    // }
    // tweet.likes.push(req.user._id);
    // await tweet.save();
    // req.user.likedTweets.push(tweet._id);
    // await req.user.save();

    await tweet.toggleLikedBy(req.user._id);
    await req.user.toggleLike(tweet._id);

    res.status(200).json({ success: true, tweet, count: tweet.likedBy.length });
  } catch (error) {
    next(error);
  }
};

// @desc      Get all tweets
// @route     GET /v1/tweets/user/:userId/likes
// @access    Public
exports.getAllUserLikes = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).populate({
      path: 'likedTweets',
      populate: { path: 'createdBy' },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User with given id does not exist' });
    }

    res.status(200).json({ success: true, tweets: user.likedTweets });
  } catch (error) {
    next(error);
  }
};
