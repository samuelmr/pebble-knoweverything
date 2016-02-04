var UI = require('ui');
var ajax = require('ajax');
var Accel = require('ui/accel');
var Voice = require('ui/voice');
var Settings = require('settings');
var wikis = require('wikis');

var langIndex = Settings.data('langIndex') || 62; // en
var random_wiki_article_url;
var wiki_article_text_url;

var defaultBody = 'Shake for a random article. Press select to set language.';
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

var tmp = new UI.Card({
  title: 'Loading...',
  body: 'Please wait!',
  scrollable: false
});

var langConfig = new UI.Card({
  title: 'Language',
  scrollable: false
});
updateLang(langIndex);

main.on('longClick', listen);
main.on('click', function() {langConfig.show();});
result.on('longClick', listen);
result.on('click', getRandom);
result.on('hide', showMain);
langConfig.on('hide', showMain);
langConfig.on('click', 'up', function() {
  updateLang(--langIndex);
});
langConfig.on('click', 'down', function() {
  updateLang(++langIndex);
});
langConfig.on('click', 'select', function() {
  langConfig.hide();
});
Accel.on('tap', getRandom);
main.show();

function showMain() {
  // a bug workaround: in order to force scrolling back to top
  // a non-scrollable short card is shown and hidden immediately
  tmp.show();
  tmp.hide();
}

function updateLang(index) {
  if (index < 0) { index = 0; }
  if (index >= wikis.length0) { index = wikis.length - 1;}
  langIndex = index;
  var lang = wikis[langIndex][2];
  langConfig.body(wikis[langIndex][0] + ' (' + wikis[langIndex][1] +')\nPress up/down to change');
  random_wiki_article_url = 'https://' + lang + '.wikipedia.org/w/api.php?format=json&action=query&rnnamespace=0&list=random';
  wiki_article_text_url = 'http://rest.wikimedia.org/' + lang + '.wikipedia.org/v1/page/mobile-text/';
  main.title('[' + lang + '] Know everything');
  Settings.data('langIndex', langIndex);
}

function listen(e) {
  result.hide();
  result.title('Speak!');
  result.subtitle('');
  result.title('Detecting audio input...');
  Voice.dictate('start', function(e) {
    console.log(e.err || e.transcription);
    if (e.err) {
      result.title('Error');
      result.title('Voice input failed.');
      result.subtitle('Please try again!');
      result.body('Long press select.');
      console.log('Error: ' + e.err);
      result.backgroundColor('white');
      result.show();
      return;
    }
    // force UTF-8 conversion
    fetchByTitle(decodeURIComponent(escape(e.transcription)));
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
    // result.backgroundColor('white');
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
  text += '\n------\nShake or press select for a random article.';
  var title = data.normalizedtitle || data.displaytitle;
  if (title ) {
    result.title(stripHTML(title));
  }
  result.subtitle('');
  result.body(text);
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
  result.show();
  console.log('The ajax request failed: ' + error);
}

function stripHTML(str) {
  str = str.replace(/<[^>]*>/gm, '').replace(/\&amp;/g, '&').replace(/\&nbsp;/g, ' ');  
  return str.replace(/\[\d+\]/g, ''); // remove references
}