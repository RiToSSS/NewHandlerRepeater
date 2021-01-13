let val;
let a = [];
let i = 0;
let selector;

function clicker() {
    chrome.runtime.sendMessage({type: 'repeat', subtype: 'isGoing'}, function(message) {
        if (message.data.allow) {
            let el = message.data.element;
            let ind = 0;
            let selectors;
            let x = 0;
            if (el.indexOf(" ") != -1) {
                x = el.substr(el.indexOf(" ") + 1);
                el = el.substring(0, el.indexOf(" "));
            }
            console.log("Нажимаем селектор: " + el + " с индексом: " + x);
            selectors = document.querySelectorAll(el);
            selectors[x].click();
            if (el.indexOf("input") == 0) {
                console.log("Найден Input, заполняем...");
                selectors[x].value = message.data.valueInput;
            }
        }
    });
}

chrome.runtime.onMessage.addListener(function(message, sender, response) {
    if (message.type == 'record') {
        if (message.subtype == "start") {
            record = true;
            response({data: {url: document.location.href}});
        }
        
        if (message.subtype == "stop") {
            record = false;
        }
    }
});

$(document).ready(function(){ 
    setInterval(clicker, 2000);
})


addEventListener('mouseup', function (event) {
    chrome.runtime.sendMessage({type: 'record', subtype: 'getInfo'}, function(message) {
        let status = message.data.status;
        // Если предыдущий элемент - input, то берём его содержимое и отправляем в background.js
        if (status) {
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
                    console.log("Найден Input: " + el + " с индексом: " + x);
                    selectors = document.querySelectorAll(el);
                    chrome.runtime.sendMessage({type:'record', subtype: 'pushInput', data: {value: selectors[x].value}});
                }
            }
    
            let className = ".";
            if(event.target.className) {
                className += event.target.className.replace(new RegExp(" ", "g"), ".");
            } else {
                className = "";
            }
            let idName = "#";
            if(event.target.id) {
                idName += event.target.id;
            } else {
                idName = "";
            }
            selector = event.target.tagName.toLowerCase() + className + idName;
            console.log("Нажат элемент: ", selector);
            if(document.querySelectorAll(selector).length > 1) {
                selector += " " + $(event.target).index(selector);
            };
            chrome.runtime.sendMessage({type:'record', subtype: 'push', data: {element: selector}});
        }
    });
}, true);

$(document).keyup(function (event) {
    if (event.key === "Escape" || event.keyCode === 27) {
        chrome.runtime.sendMessage({type: 'record', subtype: 'getInfo'}, function(message) {
            let status = message.data.status;
            if (!status) {
                chrome.runtime.sendMessage({type: 'repeat', subtype: 'askRepeat'}, function(message) {
                    if (message.data.allow) {
                        document.location.href = message.data.href;
                    } else {
                        console.log("Вы не можете запустить функцию Repeat");
                    }
                });
            } else {
                console.log("Вы не можете запустить функцию Repeat, пока идёт запись");
            }
        });
    }
});
