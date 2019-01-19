//Require Modules
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
//Require twit for the twitter data mining
const twit = require('twit');

//Require config for the keys
const config = require('./config.js');

//Use PUG for the templating
app.set('view engine', 'pug');

//Creates path for static files (e.g. CSS and images)
app.use('/static', express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//Function to log out whether all the requests are complete or not.
function endDataRequest(message, requestNumber, requestArray) {
  requestArray[requestNumber] = true;
  if (requestArray[0] && requestArray[1] && requestArray[2] && requestArray[3]) {
    console.log('All requests are complete.');
  } else {
    console.log(message + ', but not all requests are complete.');
  };
}

//Import the keys for authentication with Twitter into the twit module
const twitInstance = new twit({
  'consumer_key': config.consumer_key,
  'consumer_secret': config.consumer_secret,
  'access_token': config.access_token,
  'access_token_secret': config.access_token_secret
});

//Create an object to hold all of the twitter data
const twitterData = {
  'userInfo': {},
  'tweets': [],
  'friends': [],
  'messages': []
};

//Create an initial request to Twitter to pull the screen name, and create additional requests for the rest of the information based on the screen name value.
twitInstance
.get('account/settings', function(err, data, response) {

  //Get the screen name to be used for all other GET requests
  twitterData.userInfo.screenName =  data.screen_name;
})
.then(
  function() {
    //Create an array for testing if all of the requests are complete.
    const requestCompleteArray = [false, false, false, false];

    //Get the profile image and banner from the twitter profile.
    twitInstance
    .get('users/show', { screen_name: twitterData.userInfo.screenName },  function (err, data, response) {
      twitterData.userInfo.name = data.name;
      twitterData.userInfo.profileImage =  data.profile_image_url_https;
      twitterData.userInfo.bannerURL =  data.profile_banner_url;
    })
    .then(
      function() {
        endDataRequest('User info is done', 0, requestCompleteArray);
      } //end anonymous function inside .then()
    ); //end .then() and the request for user data

    //  Get tweets
    twitInstance
    .get('statuses/user_timeline', { screen_name: twitterData.userInfo.screenName }, function(err, data, response) {
      for (let i = 0; i < 5; i += 1) {
        if (data[i] !== undefined) {
          let tweetObject = {
            'content': data[i].text,
            'retweets': data[i].retweet_count,
            'likes': data[i].favorite_count,
            'date': data[i].created_at
          };
          twitterData.tweets.push(tweetObject);
       }; //end if
      }; //end for
    }) //end .get()
    .then(
      function() {
        endDataRequest('Tweets are done', 1, requestCompleteArray);
      } //end anonymous function inside .then()
    ); //end .then() and the request for tweets

    // Get friends
    twitInstance
    .get('friends/list', { screen_name: twitterData.userInfo.screenName },  function (err, data, response) {
      for (let i = 0; i < 5; i += 1) {
        if (data.users[i] !== undefined) {
          let friendObject = {
            'name': data.users[i].name,
            'profileImage': data.users[i].profile_image_url_https,
            'screenName': data.users[i].screen_name
          };
          twitterData.friends.push(friendObject);
        }; //end if
      }; //end for
    }) //end .get()
    .then(
      function() {
        endDataRequest('Friends are done', 2, requestCompleteArray);
      } //end anonymous function inside .then()
    ); //end .then() and request for friends

    //Direct Messages
    twitInstance.get('direct_messages/events/list', { screen_name: twitterData.userInfo.screenName },  function (err, data, response) {
      for (let i = 0; i < 5; i += 1) {
        if (data.events[i] !== undefined) {
          const date = new Date(parseInt(data.events[i].created_timestamp));
          let messageObject = {
            'created': date.toString(),
            'text': data.events[i].message_create.message_data.text
          };
          twitterData.messages.push(messageObject);
        }; //end if
      }; //end for
    }) //end .get()
    .then(
      function() {
        endDataRequest('Direct Messages are done', 3, requestCompleteArray);
      } //end anonymous function inside .then()
    ); //end .then() and direct messages

  } //end anonymous function inside initial .then()
) //end initial .then() method
.catch(
  function(err) {
    console.log(err.message);
  }
); //end of the entire twitter data request


app.get('/', (req, res) => {
  //Fill out the twitterData object with default values if there aren't enough tweets, friends, or messages.
  for (let i = 0; i < 5; i +=1 ) {
    if (twitterData.tweets[i] === undefined) {
      twitterData.tweets[i] = {
        'content': 'No tweet content to load',
        'retweets': 0,
        'likes': 0,
        'date': 'N/A'
      };
    }; //end if
    if (twitterData.friends[i] === undefined) {
      twitterData.friends[i] = {
        'name': 'No friend data to load',
        'screenName': 'No screen name to load',
        'profileImage': 'No image to load'
      };
    }; //end if
    if (twitterData.messages[i] === undefined) {
      twitterData.messages[i] = {
        'created': 'N/A',
        'text': 'No message to load'
      };
    }; //end if
  }; //end for

  res.render('index', {
    'screenName': twitterData.userInfo.screenName,
    'name': twitterData.userInfo.name,
    'profileImage': twitterData.userInfo.profileImage,
    'bannerURL': twitterData.userInfo.bannerURL,
    'tweet0': {
      'content': twitterData.tweets[0].content,
      'retweets': twitterData.tweets[0].retweets,
      'likes': twitterData.tweets[0].likes,
      'date': twitterData.tweets[0].date
    },
    'tweet1': {
      'content': twitterData.tweets[1].content,
      'retweets': twitterData.tweets[1].retweets,
      'likes': twitterData.tweets[1].likes,
      'date': twitterData.tweets[1].date
    },
    'tweet2': {
      'content': twitterData.tweets[2].content,
      'retweets': twitterData.tweets[2].retweets,
      'likes': twitterData.tweets[2].likes,
      'date': twitterData.tweets[2].date
    },
    'tweet3': {
      'content': twitterData.tweets[3].content,
      'retweets': twitterData.tweets[3].retweets,
      'likes': twitterData.tweets[3].likes,
      'date': twitterData.tweets[3].date
    },
    'tweet4': {
      'content': twitterData.tweets[4].content,
      'retweets': twitterData.tweets[4].retweets,
      'likes': twitterData.tweets[4].likes,
      'date': twitterData.tweets[4].date
    },
    'friend0': {
      'name': twitterData.friends[0].name,
      'screenName': twitterData.friends[0].screenName,
      'profileImage': twitterData.friends[0].profileImage
    },
    'friend1': {
      'name': twitterData.friends[1].name,
      'screenName': twitterData.friends[1].screenName,
      'profileImage': twitterData.friends[1].profileImage
    },
    'friend2': {
      'name': twitterData.friends[2].name,
      'screenName': twitterData.friends[2].screenName,
      'profileImage': twitterData.friends[2].profileImage
    },
    'friend3': {
      'name': twitterData.friends[3].name,
      'screenName': twitterData.friends[3].screenName,
      'profileImage': twitterData.friends[3].profileImage
    },
    'friend4': {
      'name': twitterData.friends[4].name,
      'screenName': twitterData.friends[4].screenName,
      'profileImage': twitterData.friends[4].profileImage
    },
    'message0': {
      'created': twitterData.messages[0].created,
      'text': twitterData.messages[0].text
    },
    'message1': {
      'created': twitterData.messages[1].created,
      'text': twitterData.messages[1].text
    },
    'message2': {
      'created': twitterData.messages[2].created,
      'text': twitterData.messages[2].text
    },
    'message3': {
      'created': twitterData.messages[3].created,
      'text': twitterData.messages[3].text
    },
    'message4': {
      'created': twitterData.messages[4].created,
      'text': twitterData.messages[4].text
    }
  });
});

app.post('/', (req, res) => {
  //Post a new tweet
  twitInstance.post('statuses/update', { status: req.body.tweet }, function(err, data, response) {
    const newTweet = {
      'content': data.text,
      'retweets': 0,
      'likes': 0,
      'date': data.created_at
    };
    twitterData.tweets.unshift(newTweet);
  });
  setTimeout(function() {
    res.redirect('/');
  }, 2000);
});

//Create a 404 error page using the error.pug template
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.error = err;
  res.status(err.status);
  res.render('error');
});
//End 404 error page

//Set up the server
app.listen(5000, () => {
  console.log('The application is running on localhost:5000')
})
