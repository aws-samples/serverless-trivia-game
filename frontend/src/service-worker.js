/* eslint-disable no-undef */
workbox.core.setCacheNameDetails({prefix: "web-push-ui"});

self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

console.log('Adding listener for push notification');

//Web Push Notifications//
const broadcast = new BroadcastChannel('profile-channel');
self.addEventListener('push', function(event) {
  event.waitUntil(async function() {
    const message = event.data ? event.data.json() : 'no payload';
    broadcast.postMessage(message.notification);
  }());
});