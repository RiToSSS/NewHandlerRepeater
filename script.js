(function() {

    let selector;

    function clicker() {
        chrome.runtime.sendMessage({type: 'repeat', subtype: 'isGoing'}, function(message) {
            if (message.allow) {
                let el = message.element;
                let ind = 0;
                let selectors;
                let x = 0;
                if (el.indexOf(" ") != -1) {
                    x = el.substr(el.indexOf(" ") + 1);
                    el = el.substring(0, el.indexOf(" "));
                }
                selectors = document.querySelectorAll(el);
                selectors[x].click();
                if (el.indexOf("input") == 0) {
                    selectors[x].value = message.valueInput;
                }
            }
        });
    }
    
    chrome.runtime.onMessage.addListener(function(message, sender, response) {
        if (message.type == 'record') {
            if (message.subtype == "start") {
                response({url: document.location.href});
            }
        }
    });
    
    $(document).ready(function() { 
        timerClicker = setInterval(clicker, 3000);
    })
    
    
    addEventListener('mousedown', function (event) {
        chrome.runtime.sendMessage({type: 'record', subtype: 'getInfo'}, function(message) {
            if (message.status) {
                // Если предыдущий элемент - input, то берём его содержимое и отправляем в background.js
                if (selector) {
                    if (selector.indexOf("input") == 0) {
                        let el = selector;
                        let ind = 0;
                        let selectors;
                        let x = 0;
                        if (el.indexOf(" ") != -1) {
                            x = el.substr(el.indexOf(" ") + 1);
                            el = el.substring(0, el.indexOf(" "));
                        }
                        selectors = document.querySelectorAll(el);
                        chrome.runtime.sendMessage({type:'record', subtype: 'pushInput', value: selectors[x].value});
                    }
                }
        
                let className = event.target.className ? "." + event.target.className.replace(new RegExp(" ", "g"), ".") : "";
                let idName = event.target.id ? "#" + event.target.id : "";
                selector = event.target.tagName.toLowerCase() + className + idName;
                if(document.querySelectorAll(selector).length > 1) {
                    selector += " " + $(event.target).index(selector);
                };
                chrome.runtime.sendMessage({type:'record', subtype: 'push', element: selector});
            }
        });
    }, true);
    
    function startRepeat(content) {
        content = content.split("\n");
        $('#uploadJSONfile').remove();
        chrome.runtime.sendMessage({type: 'repeat', subtype: 'setInfo', selectors: content[1]}, function(message) {
            if (message.allow) {
                document.location.href = content[0];
    
                // Необходимо обнулить интервал, иначе может начаться процесс нажатия на элементы ещё до загрузки стартовой страницы
                clearInterval(timerClicker);
            }
        });
    }
    
    $(document).on('change', '#uploadJSONfile', function (e) {
        if (window.FileList && window.File) {
            const file = e.target.files[0];
            const name = file.name ? file.name : 'NOT SUPPORTED';
            if (name.indexOf(".json") != -1) {
                const reader = new FileReader();
                reader.addEventListener('load', event => {
                    let content = event.target.result;
                    startRepeat(content);
                });
                reader.readAsText(file);
            }       
        }
    });
    
    $(document).keyup(function (event) {
        if (event.key === "Escape" || event.keyCode === 27) {
            chrome.runtime.sendMessage({type: 'record', subtype: 'getInfo'}, function(message) {
                // Загрузку из фоновой страницы нельзя симитировать через нажатие <input> (File chooser dialog can only be shown with a user activation)
                if (!message.status) {
                    $('body').append("<input type='file' style='position: fixed; top: 0; left: 0;' id='uploadJSONfile'/>");
                }
            });
        }
    });

 })();