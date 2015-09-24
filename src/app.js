var UI = require('ui');
var ajax = require('ajax');
var Accel = require('ui/accel');

Accel.init();
Accel.on('tap', getRandom);

var main = new UI.Card({
  backgroundColor: 'black',
  textColor: 'white',
  title: 'Random fact',
  // icon: 'images/menu_icon.png',
  subtitle: 'Loading...',
  body: 'Please wait!',
  scrollable: true
});

main.show();
getRandom();

function getRandom() {
  ajax(
    {
      url: 'https://en.wikipedia.org/w/api.php?format=json&action=query&rnnamespace=0&list=random',
      type: 'json'
    },
    fetchArticle,
    ajaxError
  );
}

function fetchArticle(data, status, request) {
  var title = data.query.random[0].title;
  main.title(title);
  fetchByTitle(title);
}

function fetchByTitle(title) {
  var url = 'http://rest.wikimedia.org/en.wikipedia.org/v1/page/mobile-text/' + title;
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
  if (!data || !data.sections || !data.sections[0] || !data.sections[0].items) {
    console.warn('No page contents!');
    console.log(JSON.stringify(data));
    main.subtitle('Failed, sorry!');
    main.body("Shake your wrist for another random article!");
    return false;
  }
  var text = "Nothing found...";
  for (var i=0; i<data.sections[0].items.length; i++) {
    var o = data.sections[0].items[i];
    if (!o.type || (o.type != 'p')) {
      continue;
    }
    text = o.text.replace(/<[^>]*>/gm, '').replace(/\&amp;/g, '&');
    // continue if the first paragraph ends with a colon
    if (!text.match(/\:\s*$/)) {
      break;
    }
  }
  main.subtitle(null);
  main.body(text);
}

function ajaxError(error, status, request) {
  console.log('The ajax request failed: ' + error);
}

