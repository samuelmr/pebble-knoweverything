var UI = require('ui');
var ajax = require('ajax');
var Accel = require('ui/accel');
var txtwiki = require('txtwiki.js');

Accel.init();
Accel.on('tap', getRandom);

var pageId;

var main = new UI.Card({
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
  var url = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=content&titles=' + 
    title;
  console.log(url);
  pageId = data.query.random[0].id;
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
  if (!data || !data.query || !data.query.pages || !data.query.pages[pageId]) {
    console.warn('No page contents! ' + pageId);
    console.log(data.query.pages);
    main.subtitle('Failed, sorry!');
    main.body("Shake your wrist for another article!");
    return false;
  }
  var revs = data.query.pages[pageId].revisions;
  var text = revs[revs.length-1]['*']; // latest revision?
  // console.log(text.length);
  // console.log(text);
  var res = text.match(/([\s\S]*?)^=/m);
  if (res && res[1]) {
    // only keep text before first heading
    text = res[1];
  }
  main.subtitle(null);
  main.body(txtwiki.parseWikitext(text));
}

function ajaxError(error, status, request) {
  console.log('The ajax request failed: ' + error);
}

