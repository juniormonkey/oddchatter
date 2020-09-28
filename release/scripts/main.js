/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
function aa(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}}function n(a){var b="undefined"!=typeof Symbol&&Symbol.iterator&&a[Symbol.iterator];return b?b.call(a):{next:aa(a)}}var p="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(a==Array.prototype||a==Object.prototype)return a;a[b]=c.value;return a};
function ba(a){a=["object"==typeof globalThis&&globalThis,a,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var b=0;b<a.length;++b){var c=a[b];if(c&&c.Math==Math)return c}throw Error("Cannot find global object");}var q=ba(this);function r(a,b){if(b)a:{var c=q;a=a.split(".");for(var e=0;e<a.length-1;e++){var h=a[e];if(!(h in c))break a;c=c[h]}a=a[a.length-1];e=c[a];b=b(e);b!=e&&null!=b&&p(c,a,{configurable:!0,writable:!0,value:b})}}
function t(){this.f=!1;this.b=null;this.l=void 0;this.a=1;this.j=0;this.c=null}function w(a){if(a.f)throw new TypeError("Generator is already running");a.f=!0}t.prototype.g=function(a){this.l=a};function x(a,b){a.c={K:b,L:!0};a.a=a.j}t.prototype.return=function(a){this.c={return:a};this.a=this.j};function y(a,b,c){a.a=c;return{value:b}}function ca(a){this.a=new t;this.b=a}
function da(a,b){w(a.a);var c=a.a.b;if(c)return A(a,"return"in c?c["return"]:function(e){return{value:e,done:!0}},b,a.a.return);a.a.return(b);return B(a)}function A(a,b,c,e){try{var h=b.call(a.a.b,c);if(!(h instanceof Object))throw new TypeError("Iterator result "+h+" is not an object");if(!h.done)return a.a.f=!1,h;var m=h.value}catch(f){return a.a.b=null,x(a.a,f),B(a)}a.a.b=null;e.call(a.a,m);return B(a)}
function B(a){for(;a.a.a;)try{var b=a.b(a.a);if(b)return a.a.f=!1,{value:b.value,done:!1}}catch(c){a.a.l=void 0,x(a.a,c)}a.a.f=!1;if(a.a.c){b=a.a.c;a.a.c=null;if(b.L)throw b.K;return{value:b.return,done:!0}}return{value:void 0,done:!0}}
function ea(a){this.next=function(b){w(a.a);a.a.b?b=A(a,a.a.b.next,b,a.a.g):(a.a.g(b),b=B(a));return b};this.throw=function(b){w(a.a);a.a.b?b=A(a,a.a.b["throw"],b,a.a.g):(x(a.a,b),b=B(a));return b};this.return=function(b){return da(a,b)};this[Symbol.iterator]=function(){return this}}function fa(a){function b(e){return a.next(e)}function c(e){return a.throw(e)}return new Promise(function(e,h){function m(f){f.done?e(f.value):Promise.resolve(f.value).then(b,c).then(m,h)}m(a.next())})}
function C(a){return fa(new ea(new ca(a)))}r("Symbol",function(a){function b(h){if(this instanceof b)throw new TypeError("Symbol is not a constructor");return new c("jscomp_symbol_"+(h||"")+"_"+e++,h)}function c(h,m){this.a=h;p(this,"description",{configurable:!0,writable:!0,value:m})}if(a)return a;c.prototype.toString=function(){return this.a};var e=0;return b});
r("Symbol.iterator",function(a){if(a)return a;a=Symbol("Symbol.iterator");for(var b="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),c=0;c<b.length;c++){var e=q[b[c]];"function"===typeof e&&"function"!=typeof e.prototype[a]&&p(e.prototype,a,{configurable:!0,writable:!0,value:function(){return ha(aa(this))}})}return a});function ha(a){a={next:a};a[Symbol.iterator]=function(){return this};return a}
r("Promise",function(a){function b(f){this.b=0;this.c=void 0;this.a=[];this.l=!1;var d=this.f();try{f(d.resolve,d.reject)}catch(g){d.reject(g)}}function c(){this.a=null}function e(f){return f instanceof b?f:new b(function(d){d(f)})}if(a)return a;c.prototype.b=function(f){if(null==this.a){this.a=[];var d=this;this.c(function(){d.g()})}this.a.push(f)};var h=q.setTimeout;c.prototype.c=function(f){h(f,0)};c.prototype.g=function(){for(;this.a&&this.a.length;){var f=this.a;this.a=[];for(var d=0;d<f.length;++d){var g=
f[d];f[d]=null;try{g()}catch(k){this.f(k)}}}this.a=null};c.prototype.f=function(f){this.c(function(){throw f;})};b.prototype.f=function(){function f(k){return function(l){g||(g=!0,k.call(d,l))}}var d=this,g=!1;return{resolve:f(this.P),reject:f(this.g)}};b.prototype.P=function(f){if(f===this)this.g(new TypeError("A Promise cannot resolve to itself"));else if(f instanceof b)this.S(f);else{a:switch(typeof f){case "object":var d=null!=f;break a;case "function":d=!0;break a;default:d=!1}d?this.M(f):this.j(f)}};
b.prototype.M=function(f){var d=void 0;try{d=f.then}catch(g){this.g(g);return}"function"==typeof d?this.H(d,f):this.j(f)};b.prototype.g=function(f){this.u(2,f)};b.prototype.j=function(f){this.u(1,f)};b.prototype.u=function(f,d){if(0!=this.b)throw Error("Cannot settle("+f+", "+d+"): Promise already settled in state"+this.b);this.b=f;this.c=d;2===this.b&&this.R();this.C()};b.prototype.R=function(){var f=this;h(function(){if(f.D()){var d=q.console;"undefined"!==typeof d&&d.error(f.c)}},1)};b.prototype.D=
function(){if(this.l)return!1;var f=q.CustomEvent,d=q.Event,g=q.dispatchEvent;if("undefined"===typeof g)return!0;"function"===typeof f?f=new f("unhandledrejection",{cancelable:!0}):"function"===typeof d?f=new d("unhandledrejection",{cancelable:!0}):(f=q.document.createEvent("CustomEvent"),f.initCustomEvent("unhandledrejection",!1,!0,f));f.promise=this;f.reason=this.c;return g(f)};b.prototype.C=function(){if(null!=this.a){for(var f=0;f<this.a.length;++f)m.b(this.a[f]);this.a=null}};var m=new c;b.prototype.S=
function(f){var d=this.f();f.B(d.resolve,d.reject)};b.prototype.H=function(f,d){var g=this.f();try{f.call(d,g.resolve,g.reject)}catch(k){g.reject(k)}};b.prototype.then=function(f,d){function g(v,z){return"function"==typeof v?function(U){try{k(v(U))}catch(V){l(V)}}:z}var k,l,u=new b(function(v,z){k=v;l=z});this.B(g(f,k),g(d,l));return u};b.prototype.catch=function(f){return this.then(void 0,f)};b.prototype.B=function(f,d){function g(){switch(k.b){case 1:f(k.c);break;case 2:d(k.c);break;default:throw Error("Unexpected state: "+
k.b);}}var k=this;null==this.a?m.b(g):this.a.push(g);this.l=!0};b.resolve=e;b.reject=function(f){return new b(function(d,g){g(f)})};b.race=function(f){return new b(function(d,g){for(var k=n(f),l=k.next();!l.done;l=k.next())e(l.value).B(d,g)})};b.all=function(f){var d=n(f),g=d.next();return g.done?e([]):new b(function(k,l){function u(U){return function(V){v[U]=V;z--;0==z&&k(v)}}var v=[],z=0;do v.push(void 0),z++,e(g.value).B(u(v.length-1),l),g=d.next();while(!g.done)})};return b});
function D(a,b,c){if(null==a)throw new TypeError("The 'this' value for String.prototype."+c+" must not be null or undefined");if(b instanceof RegExp)throw new TypeError("First argument to String.prototype."+c+" must not be a regular expression");return a+""}r("String.prototype.repeat",function(a){return a?a:function(b){var c=D(this,null,"repeat");if(0>b||1342177279<b)throw new RangeError("Invalid count value");b|=0;for(var e="";b;)if(b&1&&(e+=c),b>>>=1)c+=c;return e}});
r("Object.is",function(a){return a?a:function(b,c){return b===c?0!==b||1/b===1/c:b!==b&&c!==c}});r("Array.prototype.includes",function(a){return a?a:function(b,c){var e=this;e instanceof String&&(e=String(e));var h=e.length;c=c||0;for(0>c&&(c=Math.max(c+h,0));c<h;c++){var m=e[c];if(m===b||Object.is(m,b))return!0}return!1}});r("String.prototype.includes",function(a){return a?a:function(b,c){return-1!==D(this,b,"includes").indexOf(b,c||0)}});
r("String.prototype.startsWith",function(a){return a?a:function(b,c){var e=D(this,b,"startsWith"),h=e.length,m=b.length;c=Math.max(0,Math.min(c|0,e.length));for(var f=0;f<m&&c<h;)if(e[c++]!=b[f++])return!1;return f>=m}});function E(a,b){return Object.prototype.hasOwnProperty.call(a,b)}
r("WeakMap",function(a){function b(g){this.a=(d+=Math.random()+1).toString();if(g){g=n(g);for(var k;!(k=g.next()).done;)k=k.value,this.set(k[0],k[1])}}function c(){}function e(g){var k=typeof g;return"object"===k&&null!==g||"function"===k}function h(g){if(!E(g,f)){var k=new c;p(g,f,{value:k})}}function m(g){var k=Object[g];k&&(Object[g]=function(l){if(l instanceof c)return l;Object.isExtensible(l)&&h(l);return k(l)})}if(function(){if(!a||!Object.seal)return!1;try{var g=Object.seal({}),k=Object.seal({}),
l=new a([[g,2],[k,3]]);if(2!=l.get(g)||3!=l.get(k))return!1;l.delete(g);l.set(k,4);return!l.has(g)&&4==l.get(k)}catch(u){return!1}}())return a;var f="$jscomp_hidden_"+Math.random();m("freeze");m("preventExtensions");m("seal");var d=0;b.prototype.set=function(g,k){if(!e(g))throw Error("Invalid WeakMap key");h(g);if(!E(g,f))throw Error("WeakMap key fail: "+g);g[f][this.a]=k;return this};b.prototype.get=function(g){return e(g)&&E(g,f)?g[f][this.a]:void 0};b.prototype.has=function(g){return e(g)&&E(g,
f)&&E(g[f],this.a)};b.prototype.delete=function(g){return e(g)&&E(g,f)&&E(g[f],this.a)?delete g[f][this.a]:!1};return b});
r("Map",function(a){function b(){var d={};return d.m=d.next=d.head=d}function c(d,g){var k=d.a;return ha(function(){if(k){for(;k.head!=d.a;)k=k.m;for(;k.next!=k.head;)return k=k.next,{done:!1,value:g(k)};k=null}return{done:!0,value:void 0}})}function e(d,g){var k=g&&typeof g;"object"==k||"function"==k?m.has(g)?k=m.get(g):(k=""+ ++f,m.set(g,k)):k="p_"+g;var l=d.b[k];if(l&&E(d.b,k))for(d=0;d<l.length;d++){var u=l[d];if(g!==g&&u.key!==u.key||g===u.key)return{id:k,list:l,index:d,h:u}}return{id:k,list:l,
index:-1,h:void 0}}function h(d){this.b={};this.a=b();this.size=0;if(d){d=n(d);for(var g;!(g=d.next()).done;)g=g.value,this.set(g[0],g[1])}}if(function(){if(!a||"function"!=typeof a||!a.prototype.entries||"function"!=typeof Object.seal)return!1;try{var d=Object.seal({x:4}),g=new a(n([[d,"s"]]));if("s"!=g.get(d)||1!=g.size||g.get({x:4})||g.set({x:4},"t")!=g||2!=g.size)return!1;var k=g.entries(),l=k.next();if(l.done||l.value[0]!=d||"s"!=l.value[1])return!1;l=k.next();return l.done||4!=l.value[0].x||
"t"!=l.value[1]||!k.next().done?!1:!0}catch(u){return!1}}())return a;var m=new WeakMap;h.prototype.set=function(d,g){d=0===d?0:d;var k=e(this,d);k.list||(k.list=this.b[k.id]=[]);k.h?k.h.value=g:(k.h={next:this.a,m:this.a.m,head:this.a,key:d,value:g},k.list.push(k.h),this.a.m.next=k.h,this.a.m=k.h,this.size++);return this};h.prototype.delete=function(d){d=e(this,d);return d.h&&d.list?(d.list.splice(d.index,1),d.list.length||delete this.b[d.id],d.h.m.next=d.h.next,d.h.next.m=d.h.m,d.h.head=null,this.size--,
!0):!1};h.prototype.clear=function(){this.b={};this.a=this.a.m=b();this.size=0};h.prototype.has=function(d){return!!e(this,d).h};h.prototype.get=function(d){return(d=e(this,d).h)&&d.value};h.prototype.entries=function(){return c(this,function(d){return[d.key,d.value]})};h.prototype.keys=function(){return c(this,function(d){return d.key})};h.prototype.values=function(){return c(this,function(d){return d.value})};h.prototype.forEach=function(d,g){for(var k=this.entries(),l;!(l=k.next()).done;)l=l.value,
d.call(g,l[1],l[0],this)};h.prototype[Symbol.iterator]=h.prototype.entries;var f=0;return h});function ia(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var e=c.slice();e.push.apply(e,arguments);return a.apply(this,e)}};function ja(){var a=F;window.firebase.firestore().collection("configuration").orderBy("timestamp","desc").limit(1).onSnapshot(function(b){if(0<b.size){b=b.docs[0].data();a.l=b.hasOwnProperty("enabled")?b.enabled:a.l;a.u=b.hasOwnProperty("event_start")?b.event_start:a.u;a.g=b.hasOwnProperty("fallback_url")?b.fallback_url:a.g;a.f=b.hasOwnProperty("config")?b.callback_window_ms:a.f;a.a=b.hasOwnProperty("callback_threshold")?b.callback_threshold:a.a;a.j=b.hasOwnProperty("admin_users")?b.admin_users:a.j;
a.c=b.hasOwnProperty("youtube_video")?b.youtube_video:a.c;a.b=b.hasOwnProperty("youtube_chat")?b.youtube_chat:a.b;b=n(a.C);for(var c=b.next();!c.done;c=b.next())c=c.value,c(a)}},function(b){console.error("Error querying Firestore: ",b)})}var F=new function(){this.l=!1;this.u=null;this.D=!1;this.g="";this.f=1E4;this.a=3;this.b=this.c="";this.j=[];this.C=[]};function ka(a,b,c){c=c||la;for(var e=0,h=a.length,m;e<h;){var f=e+(h-e>>>1);var d=c(b,a[f]);0<d?e=f+1:(h=f,m=!d)}return m?e:-e-1}function la(a,b){return a>b?1:a<b?-1:0};function ma(){this.text="callback-message-";this.index=0}ma.prototype.next=function(){return this.text+this.index++};function G(a){return-1!==a.indexOf("googleusercontent.com")&&-1===a.indexOf("?")?a+"?sz=150":a}function na(a){var b=H().children;if(0===b.length)return null;a=ka(b,a,function(c,e){var h=parseInt(e.getAttribute("timestamp"),10);if(!h)throw Error("Child "+e.id+" has no 'timestamp' attribute");return c-h});return a>=b.length||a<-b.length?null:0<=a?b[a+1]:b[-(a+1)]}
function I(){return document.getElementById("outer-container")}function J(){return document.getElementById("promo")}function K(){return document.getElementById("error-container")}function L(){return document.getElementById("intro-container")}function H(){return document.getElementById("messages")}function M(){return document.getElementById("message")}function N(){return document.getElementById("user-name")}function O(){return document.getElementById("messages-card-container")}
function oa(){return document.getElementById("youtube-stream-container")}function P(){return document.getElementById("youtube-video")}function Q(){return document.getElementById("youtube-chat")};function R(a,b,c,e,h,m){this.text=a;this.c=b;this.b=c;this.G=e;this.a=h;this.F=m;Date.now()}function pa(a){a.a()&&a.a().removeAttribute("disabled")}function qa(a){return"\ud83d\udc4f"===a.text||"\ud83d\udc4e"===a.text?a.text.repeat(S(3,6)):a.text+"!".repeat(S(1,3))+"1".repeat(S(0,2))+"!".repeat(S(1,2))}function ra(a){return"\ud83d\udc4f"===a.text||"\ud83d\udc4e"===a.text?a.text:a.text+"!!"}function T(a){return"\ud83d\udc4f"===a.text?"APPLAUSE":"\ud83d\udc4e"===a.text?"BOO":a.text}
function S(a,b){return a+Math.floor(Math.random()*(b-a+1))}
var W=[new R("SCIENCE","\ud83d\udd2c","science1.mp4 science2.mp4 science3.mp4 science4.mp4 science5.mp4 science6.mp4 science7.mp4".split(" "),function(){return document.getElementById("science-form")},function(){return document.getElementById("science")},function(){return document.getElementById("science-audio")}),new R("ART","\ud83c\udfa8",["art1.mp4","art2.mp4","art3.mp4"],function(){return document.getElementById("art-form")},function(){return document.getElementById("art")},function(){return document.getElementById("art-audio")}),
new R("MAPS","\ud83d\uddfa\ufe0f",["maps1.mp4","maps2.mp4","maps3.mp4"],function(){return document.getElementById("maps-form")},function(){return document.getElementById("maps")},function(){return document.getElementById("maps-audio")}),new R("SHIPS","\ud83d\udea2","ships1.mp4 ships2.mp4 ships3.mp4 ships4.mp4 ships5.mp4 ships6.mp4".split(" "),function(){return document.getElementById("ships-form")},function(){return document.getElementById("ships")},function(){return document.getElementById("ships-audio")}),
new R("\ud83d\udc4f","\ud83d\udc4f",["applause1.mp4","applause2.mp4","applause3.mp4"],function(){return document.getElementById("applause-form")},function(){return document.getElementById("applause")},function(){return document.getElementById("applause-audio")}),new R("\ud83d\udc4e","\ud83d\udc4e",["boo1.mp4","boo2.mp4","boo3.mp4"],function(){return document.getElementById("boo-form")},function(){return document.getElementById("boo")},function(){return document.getElementById("boo-audio")})];function X(a,b){"undefined"!==typeof analytics&&analytics.T(a,b)};function Y(){return window.firebase.auth().currentUser.uid}function sa(){return window.firebase.auth().currentUser.photoURL||"/images/profile_placeholder.png"};function ta(){var a=new firebase.auth.GoogleAuthProvider;firebase.auth().signInWithPopup(a);X("login",{method:""})}function ua(){firebase.auth().signOut()}function va(a){W.forEach(function(b){a===ra(b)&&window.firebase.firestore().collection(T(b)).doc(Y()).set({O:sa(),timestamp:window.firebase.firestore.FieldValue.serverTimestamp()}).catch(function(c){console.error("Error writing new message to database",c)})})}
function wa(a){va(a);return window.firebase.firestore().collection("messages").add({uid:Y(),name:window.firebase.auth().currentUser.displayName,text:a,profilePicUrl:sa(),timestamp:window.firebase.firestore.FieldValue.serverTimestamp()}).catch(function(b){console.error("Error writing new message to database",b)})}function xa(a){return C(function(b){a.preventDefault();X("share",{method:"chat",J:"freeform",I:""});return y(b,ya(M().value),0)})}
function za(a,b){return C(function(c){if(1==c.a)return b.preventDefault(),X("share",{method:"chat",J:T(a),I:""}),y(c,ya(ra(a)),2);a.a().setAttribute("disabled","true");setTimeout(function(){return pa(a)},1E3);c.a=0})}
function ya(a){return C(function(b){if(1==b.a){var c;if(c=a)window.firebase.auth().currentUser?c=!0:(document.getElementById("must-signin-snackbar").MaterialSnackbar.showSnackbar({message:"You must sign-in first",timeout:2E3}),c=!1);c?b=y(b,wa(a),3):(b.a=0,b=void 0);return b}c=M();c.value="";c.parentNode.MaterialTextfield&&c.parentNode.MaterialTextfield.boundUpdateClassesHandler();Aa();b.a=0})}
function Aa(){M().value?document.getElementById("submit").removeAttribute("disabled"):document.getElementById("submit").setAttribute("disabled","true")};var Ba=W.map(function(a){return ra(a)});function Ca(a,b,c,e,h,m,f){this.id=a;this.timestamp=b;this.f=c;this.c=e;this.a=h;this.text=m;this.b=f;this.g=new Autolinker({U:!0,V:!1,W:!1})}Ca.prototype.remove=function(){var a=document.getElementById(this.id);a&&a.parentNode.removeChild(a)};
function Da(a){if(!Ba.includes(a.text)){var b=document.getElementById(a.id)||Ea(a),c=H().scrollTop>=H().scrollHeight-H().clientHeight-b.clientHeight||null===b.nextElementSibling&&a.f===Y();a.a&&(b.querySelector(".pic").style.backgroundImage="url("+G(a.a)+")");b.querySelector(".name").textContent=a.c;a.timestamp&&1E4<a.timestamp.getTime()&&(b.querySelector(".timestamp").textContent=a.timestamp.toLocaleDateString()+" "+a.timestamp.toLocaleTimeString());var e=b.querySelector(".message");if(F.j.includes(Y())&&
!a.id.startsWith("callback-message-")&&!b.querySelector(".admin")){var h=document.createElement("a");h.className="admin";h.setAttribute("href","#");h.textContent="delete";h.addEventListener("click",function(){firebase.firestore().collection("messages").doc(a.id).delete().catch(function(d){console.error("Error removing message: ",d)})});b.appendChild(h)}if(a.text)e.textContent=a.text,e.innerHTML=DOMPurify.sanitize(e.innerHTML),e.innerHTML=a.g.link(e.innerHTML),e.innerHTML=e.innerHTML.replace(/\n/g,
"<br>");else if(a.b){h=document.createElement("video");h.addEventListener("load",function(){c&&(H().scrollTop=H().scrollHeight)});h.a=!0;h.autoplay=!0;h.muted=!0;h.className="callback-video";var m=document.createElement("source");m.src=a.b;m.type="video/mp4";var f=document.createTextNode("Your browser does not support the video tag.");h.innerHTML="";h.appendChild(m);h.appendChild(f);h.onloadedmetadata=function(){c&&(H().scrollTop=H().scrollHeight)};e.innerHTML="";e.appendChild(h)}setTimeout(function(){b.classList.add("visible")},
1);c&&(H().scrollTop=H().scrollHeight);M()&&M().focus()}}function Ea(a){var b=document.createElement("div");b.innerHTML='<div class="message-container"><div class="spacing"><div class="pic"></div></div><div class="message"></div><div class="name"></div><div class="timestamp"></div></div>';b=b.firstChild;b.setAttribute("id",a.id);b.setAttribute("timestamp",Fa(a));(a=na(Fa(a)))?H().insertBefore(b,a):H().appendChild(b);return b}
function Fa(a){a.timestamp||(a.timestamp=new Date);return a.timestamp.getTime()}var Ga=new Map,Z=[];function Ha(a){a.docChanges&&(a.docChanges().forEach(function(b){if("removed"===b.type)Ga.get(b.doc.id).remove();else{var c=b.doc.data(),e=c.timestamp?c.timestamp.toDate():null;b=b.doc.id;c=new Ca(b,e,c.uid,c.name,c.profilePicUrl,c.text,c.videoUrl);Ga.set(b,c);Da(c)}}),a.empty||Z.push(a.query.startAfter(a.docs[a.size-1]).onSnapshot(Ha,Ia)))}
function Ia(a){console.error("Error querying Firestore: ",a)};function Ja(a){this.o=a;this.b=Date.now()-F.f;this.a=this.A=null}function Ka(a,b){if(b){var c=Math.max(a.b,Date.now()-F.f),e=b.filter(function(h){return La(h.data())>c});0<e.length&&(b=La(b[0].data()),0<b&&(e.length>=F.a?(a.a&&(a.a.a.remove(),a.a=null),a.b=b+1E3,Ma(a,b+1),X("screen_view",{v:T(a.o)})):(e=e.map(function(h){return{uid:h.id,N:h.data().O}}),Na(a,b,e,c))))}}
function Na(a,b,c,e){if(!a.a||a.a.timestamp<e)a.a=new Oa(a.o.c,qa(a.o),b),Pa(a.a);b=n(c);for(c=b.next();!c.done;c=b.next()){var h=c.value;c=a.a;e=h.uid;h=h.N;if(!c.b.includes(e)){c.b.push(e);var m=c.a.querySelector(".callback-progress-bar");m.style.width=100*c.b.length/F.a+"%";var f=document.createElement("div");f.className="callback-progress-voice";h&&(f.style.backgroundImage="url("+G(h)+")");m.insertBefore(f,c.a.querySelector(".callback-progress-callback"));if(H().scrollTop>=H().scrollHeight-H().clientHeight-
60||e===Y())H().scrollTop=H().scrollHeight}}}function Ma(a,b){var c=H().scrollTop>=H().scrollHeight-H().clientHeight-60,e="video/"+a.o.b[Math.floor(Math.random()*a.o.b.length)],h=Qa.next();b=new Date(b);var m=qa(a.o);e=new Ca(h,b,"",m,"images/adventureharvey.jpg","",e);Ga.set(h,e);Da(e);c&&(H().scrollTop=H().scrollHeight);a.o.F().play()}var Qa=new ma;function Oa(a,b,c){this.id=Qa.next();this.c=a;this.f=b;this.timestamp=c;this.a=null;this.b=[]}
function Pa(a){var b=H().scrollTop>=H().scrollHeight-H().clientHeight-60;if(!document.getElementById(a.id)){var c=document.createElement("div");c.innerHTML='<div class="message-container">  <div class="spacing"><div class="callback-emoji"></div></div>  <div class="callback-progress">    <div class="callback-progress-bar">      <div class="callback-progress-callback"></div>    </div>  </div></div>';a.a=c.firstChild;a.a.setAttribute("id",a.id);a.a.setAttribute("timestamp",a.timestamp);a.a.querySelector(".callback-emoji").innerText=
a.c;a.a.querySelector(".callback-progress-callback").innerText=a.f;(c=na(a.timestamp))?H().insertBefore(a.a,c):H().appendChild(a.a);setTimeout(function(){a.a.classList.add("visible")},1)}b&&(H().scrollTop=H().scrollHeight)}function La(a){return a&&a.timestamp&&a.timestamp.toMillis?a.timestamp.toMillis():-1}var Ra=W.map(function(a){return new Ja(a)});function Sa(a){a.l?a.g&&document.getElementById("error-link")?(K().removeAttribute("hidden"),I().setAttribute("hidden",!0),J().setAttribute("hidden",!0),document.getElementById("error-link").setAttribute("href",a.g),X("screen_view",{v:"error"})):(I().hasAttribute("hidden")&&(I().removeAttribute("hidden"),J()&&J().setAttribute("hidden",!0),K()&&K().setAttribute("hidden",!0),X("screen_view",{v:"main"})),P()&&(a.c?(P().src="https://www.youtube.com/embed/"+a.c,P().removeAttribute("hidden")):P().setAttribute("hidden",
!0)),Q()&&(a.b?(Q().src="https://www.youtube.com/live_chat?v="+a.b+("&embed_domain="+window.location.hostname),Q().removeAttribute("hidden")):Q().setAttribute("hidden",!0)),oa()&&(a.c||a.b?oa().removeAttribute("hidden"):oa().setAttribute("hidden",!0))):J()&&(J().removeAttribute("hidden"),I().setAttribute("hidden",!0),K().setAttribute("hidden",!0),X("screen_view",{v:"promo"}))}
function Ta(a){var b,c,e,h,m;return C(function(f){if(1==f.a){if(!a){N().setAttribute("hidden","true");document.getElementById("user-pic").setAttribute("hidden","true");document.getElementById("sign-out").setAttribute("hidden","true");document.getElementById("sign-in").removeAttribute("hidden");document.getElementById("signin-splashscreen").removeAttribute("hidden");O().setAttribute("hidden","true");b=n(Ra);for(c=b.next();!c.done;c=b.next())e=c.value,e.A&&(e.A(),e.A=null);for(var d=n(Z),g=d.next();!g.done;g=
d.next())g=g.value,g();Z=[];f.a=0;return}h=sa();m=window.firebase.auth().currentUser.displayName;document.getElementById("user-pic").style.backgroundImage="url("+G(h)+")";N().textContent=m;N().removeAttribute("hidden");document.getElementById("user-pic").removeAttribute("hidden");document.getElementById("sign-out").removeAttribute("hidden");document.getElementById("sign-in").setAttribute("hidden","true");document.getElementById("signin-splashscreen").setAttribute("hidden","true");Sa(F);if(F.D||!L()){Ua();
f.a=0;return}return y(f,Va(),4)}Ua();f.a=0})}function Ua(){O().removeAttribute("hidden");L()&&L().setAttribute("hidden",!0);M()&&(M().removeAttribute("disabled"),M().focus());Wa();var a=F.u,b=firebase.firestore().collection("messages").limit(8);a&&(b=b.where("timestamp",">",a));b=b.orderBy("timestamp","desc");0==Z.length&&Z.push(b.onSnapshot(Ha,Ia));X("screen_view",{v:"chat"})}
function Va(){L().removeAttribute("hidden");O().setAttribute("hidden",!0);X("screen_view",{v:"introduction"});return new Promise(function(a){document.getElementById("intro-button").addEventListener("click",function(){for(var b={},c=n(W),e=c.next();!e.done;b={i:b.i},e=c.next())e=e.value,b.i=e.F(),b.i.volume=0,b.i.muted=!0,b.i.playbackRate=2,b.i.onended=function(h){return function(){h.i.volume=1;h.i.muted=!1;h.i.playbackRate=1;h.i.onended=null}}(b),b.i.play(),pa(e);F.D=!0;a()})})}
function Wa(){for(var a={},b=n(Ra),c=b.next();!c.done;a={s:a.s},c=b.next())a.s=c.value,c=window.firebase.firestore().collection(T(a.s.o)).orderBy("timestamp","desc").limit(F.a),a.s.A||(a.s.A=c.onSnapshot(function(e){return function(h){Ka(e.s,h.docs)}}(a),function(e){console.error("Error querying Firestore: ",e)}))};if(window.firebase&&firebase.app instanceof Function&&firebase.app().options){document.getElementById("message-form")&&document.getElementById("message-form").addEventListener("submit",xa);document.getElementById("sign-out").addEventListener("click",ua);document.getElementById("sign-in").addEventListener("click",ta);document.getElementById("sign-in-splash").addEventListener("click",ta);for(var Xa=n(W),Ya=Xa.next();!Ya.done;Ya=Xa.next()){var Za=Ya.value;Za.G()&&Za.G().addEventListener("submit",ia(za,
Za))}M()&&(M().addEventListener("keyup",Aa),M().addEventListener("change",Aa));firebase.auth().onAuthStateChanged(Ta);F.C.push(Sa);ja()}else window.alert("You have not configured and imported the Firebase SDK. Make sure you go through the codelab setup instructions and make sure you are running the codelab using `firebase serve`");
