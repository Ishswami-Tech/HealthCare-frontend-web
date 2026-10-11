import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');

function startWorker(config) {
  const listeners = new Map();
  const notifications = [];
  let backgroundHandler;
  let handlerCount = 0;
  const firebase = {
    apps: [],
    initializeApp(value) { this.apps.push(value); },
    messaging() {
      return {
        onBackgroundMessage(handler) {
          backgroundHandler = handler;
          handlerCount += 1;
        },
      };
    },
  };
  const self = {
    addEventListener(name, handler) { listeners.set(name, handler); },
    registration: {
      async showNotification(title, options) { notifications.push({ title, options }); },
    },
  };
  vm.runInNewContext(source, {
    self, firebase, console,
    importScripts(url) {
      if (url === '/api/firebase/config') self.__FIREBASE_CONFIG__ = config;
    },
  });
  return {
    firebase, notifications, listeners,
    receive: (payload) => backgroundHandler(payload),
    handlerCount: () => handlerCount,
  };
}

const config = { apiKey: 'test-public-key', projectId: 'test-project' };

test('a restarted worker initializes without an open page sending configuration', () => {
  const worker = startWorker(config);
  assert.equal(worker.firebase.apps.length, 1);
  worker.listeners.get('message')({ data: { type: 'FIREBASE_CONFIG', firebaseConfig: config } });
  assert.equal(worker.handlerCount(), 1);
});

test('notification payloads do not produce a second browser notification', async () => {
  const worker = startWorker(config);
  await worker.receive({ notification: { title: 'Notification' } });
  assert.equal(worker.notifications.length, 0);
  await worker.receive({ data: { title: 'New alert', body: 'Open the app', id: 'alert-1' } });
  assert.equal(worker.notifications.length, 1);
  assert.equal(worker.notifications[0].title, 'New alert');
  assert.equal(worker.notifications[0].options.data.id, 'alert-1');
});

test('incomplete configuration leaves messaging disabled', () => {
  const worker = startWorker({});
  assert.equal(worker.firebase.apps.length, 0);
  assert.equal(worker.handlerCount(), 0);
});
