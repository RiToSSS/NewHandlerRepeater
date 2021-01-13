let record = false;
let repeat = false;
let a;
let aInput;
let url;
let i = 0;
let j = 0;
let status = "Off";

chrome.browserAction.setBadgeBackgroundColor({color: "red"});
chrome.browserAction.setBadgeText({text: status});

chrome.browserAction.onClicked.addListener(()=> {
   if (status == "Off") {
      chrome.browserAction.setBadgeBackgroundColor({color: "green"});
      status = "On";
      record = true;
      a = [];
      aInput = [];
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
         chrome.tabs.sendMessage(tabs[0].id, {type: 'record', subtype: 'start'}, function(message) {
            url = message.data.url;
         });
      });
   } else {
      chrome.browserAction.setBadgeBackgroundColor({color: "red"});
      status = "Off";
      record = false;
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
         chrome.tabs.sendMessage(tabs[0].id, {type: 'record', subtype: 'stop'});
      });
   }
   chrome.browserAction.setBadgeText({text: status});
});

chrome.runtime.onMessage.addListener(function(message, sender, response) {
   if (message.type == 'record') {
      if (message.subtype == 'getInfo') {
         response ({data: {status: record}});
      }

      if (message.subtype == 'start') {
         a = [];
         aInput = [];
         record = message.data.status;
         url = message.data.url;
      }

      if (message.subtype == 'push') {
         console.log("Нажат элемент: ", message.data.element);
         a.push(message.data.element);
      }

      if (message.subtype == 'pushInput') {
         aInput.push(message.data.value);
         console.log(JSON.stringify(aInput));
      }

      if (message.subtype == 'stop') {
         record = message.data.status;
      }
   }

   if (message.type == 'repeat') {
      if (message.subtype == 'askRepeat') {
         if ((a.length > 1) && (!repeat)) {
            console.log("Переход на страницу: ", url);
            repeat = true;
            console.log(JSON.stringify(a));
            response ({data: {allow: repeat, href: url}});
         } else {
            console.log("Длина массива: ", a.length, "Идёт повтор: ", repeat);
            response ({data: {allow: false}});
         }
      }

      if (message.subtype == 'start') {
         response ({data: {allow: repeat, array: JSON.stringify(a)}});
      }

      if (message.subtype == 'isGoing') {
         if (repeat) {
            if (i < a.length) {
               console.log("Нажимаем на элемент: ", a[i]);
               if (a[i].indexOf("input") == 0) {
                  console.log("Input... ", JSON.stringify(aInput[j]));
                  response ({data: {allow: repeat, element: a[i], valueInput: aInput[j]}});
                  j++;
               } else {
                  response ({data: {allow: repeat, element: a[i]}});
               }
               i++;
            } else {
               i = 0;
               repeat = false;
            }
         } else {
            response ({data: {allow: false}});
         }
      }

      if (message.subtype == 'end') {
         repeat = false;
      }
   }
});