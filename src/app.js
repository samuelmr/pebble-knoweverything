var UI = require('ui');
var ajax = require('ajax');
var Accel = require('ui/accel');
var Voice = require('ui/voice');

var random_wiki_article_url = 'https://en.wikipedia.org/w/api.php?format=json&action=query&rnnamespace=0&list=random';
var wiki_article_text_url = 'http://rest.wikimedia.org/en.wikipedia.org/v1/page/mobile-text/';
var defaultBody = 'Shake your wrist for a random article.';
if(Pebble.getActiveWatchInfo) {
  var platform = Pebble.getActiveWatchInfo().platform;
  if (platform && (platform != 'aplite')) {
    defaultBody = 'Long press select for voice input. ' + defaultBody;
  }
} 

var result = new UI.Card({
  backgroundColor: 'white',
  titleColor: 'black',
  subtitleColor: 'black',
  bodyColor: 'black',
  fullscreen: true,
  scrollable: true  
});

var main = new UI.Card({
  backgroundColor: 'black',
  titleColor: 'white',
  subtitleColor: 'white',
  bodyColor: 'white',
  fullscreen: true,
  title: 'Know everything',
  // icon: 'images/menu_icon.png',
  subtitle: '',
  body: defaultBody,
  scrollable: true
});

main.on('longClick', listen);
result.on('longClick', listen);
result.on('hide', main.backgroundColor('black'));
Accel.on('tap', getRandom);
main.show();

function listen(e) {
  result.hide();
  result.title('Speak!');
  result.subtitle('');
  result.title('Detecting audio input...');
  result.backgroundColor('white');
  Voice.dictate('start', function(e) {
    console.log(e.err || e.transcription);
    if (e.err) {
      result.title('Error');
      result.subtitle('Voice input failed.');
      result.title('Please try again!');
      console.log('Error: ' + e.err);
      result.backgroundColor('white');
      result.show();
      return;
    }
    fetchByTitle(e.transcription);
  });  
}

function getRandom() {
  ajax(
    {
      url: random_wiki_article_url,
      type: 'json'
    },
    fetchArticle,
    ajaxError
  );
}

function fetchArticle(data, status, request) {
  var title = data.query.random[0].title;
  result.title(title);
  result.backgroundColor('white');
  fetchByTitle(title);
}

function fetchByTitle(title) {
  var url = wiki_article_text_url + encodeURIComponent(title);
  console.log(url);
  ajax(
    {
      url: url,
      type: 'json'
    },
    printArticle,
    ajaxError
  );  
}

function printArticle(data, status, request) {
  result.hide();
  if (!data || !data.sections || !data.sections[0] || !data.sections[0].items) {
    console.warn('No page contents!');
    console.log(JSON.stringify(data));
    result.title('Failed, sorry!');
    result.subtitle('');
    result.body(defaultBody);
    result.backgroundColor('white');
    result.show();
    return false;
  }
  var text = "Nothing found...";
  for (var i=0; i<data.sections[0].items.length; i++) {
    var o = data.sections[0].items[i];
    if (!o.type || (o.type != 'p')) {
      continue;
    }
    text = stripHTML(o.text);
    // continue if the first paragraph ends with a colon
    if (!text.match(/\:\s*$/)) {
      break;
    }
  }
  var title = data.normalizedtitle || data.displaytitle;
  if (title ) {
    result.title(stripHTML(title));
  }
  result.subtitle('');
  result.body(text);
  result.backgroundColor('white');
  result.show();
}

function ajaxError(error, status, request) {
  result.hide();
  result.title('Error');
  result.subtitle('Try again!');
  if (error && error.title) {
    result.subtitle(stripHTML(error.title));
  }
  result.body(defaultBody);
  result.backgroundColor('white');
  result.show();
  console.log('The ajax request failed: ' + error);
}

function stripHTML(str) {
  str = str.replace(/<span>\[<\/span>\d+<span>\]<\/span>/g, ''); // references
  return str.replace(/<[^>]*>/gm, '').replace(/\&amp;/g, '&').replace(/\&nbsp;/g, ' ');  
}