(function() {

   let record = false;
   let repeat = false;
   let selectors;
   let text_input;
   let url;
   let index_selector = 0;
   let index_text = 0;

   
   chrome.browserAction.setBadgeBackgroundColor({color: "red"});
   chrome.browserAction.setBadgeText({text: "Off"});

   function downloadFile(el, text, name, type) {
      let  file = new Blob([text], {type: type});
      el.href = URL.createObjectURL(file);
      el.download = name;
   }

   chrome.browserAction.onClicked.addListener(()=> {
      if (!record) {
         chrome.browserAction.setBadgeBackgroundColor({color: "green"});
         record = true;
         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: 'record', subtype: 'start'}, function(message) {
               url = message.url;
            });
         });
      } else {
         chrome.browserAction.setBadgeBackgroundColor({color: "red"});
         record = false;
         // Единственный способ скачать файл - создать элемент <a> и симитировать его нажатие с помощью метода click(),
         // так как вручную нажать на него через фоновую страницу невозможно
         if (selectors.length > 0) {
            $('body').append("<a id='download'></a>");
            download = document.getElementById('download');
            downloadFile(download, url + "\n" + JSON.stringify(selectors), 'repeat_script.json', 'text/plain')
            download.click();
            $('a#download').remove();
         }
      }
      selectors = [];
      chrome.browserAction.setBadgeText({text: record ? "On" : "Off"});
   });

   chrome.runtime.onMessage.addListener(function(message, sender, response) {
      if (message.type == 'record') {
         if (message.subtype == 'getInfo') {
            response ({status: record});
         }

         if (message.subtype == 'start') {
            record = message.status;
            url = message.url;
         }

         if (message.subtype == 'push') {
            selectors.push(message.element);
         }
      }

      if (message.type == 'repeat') {
         if (message.subtype == 'setInfo') {
            if (!repeat) {
               selectors = JSON.parse(message.selectors);
               repeat = true;
            }
            response ({allow: repeat});
         }

         if (message.subtype == 'isGoing') {
            if (repeat) {
               if (index_selector < selectors.length) {
                     response ({allow: repeat, element: selectors[index_selector]});
                     index_selector++;
               } else {
                  index_selector = 0;
                  index_text = 0;
                  repeat = false;
               }
            } else {
               response ({allow: repeat});
            }
         }
      }
   });
   
})();