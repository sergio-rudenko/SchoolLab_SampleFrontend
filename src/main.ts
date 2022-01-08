import Vue from 'vue';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Laue } from 'laue';
import BluetoothPlugin from './plugins/BluetoothPlugin';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.use(Laue);
Vue.use(BluetoothPlugin, {
  store,
  mutation: {
    disconnected: 'BLUETOOTH_DEVICE_DISCONNECTED',
    connected: 'BLUETOOTH_DEVICE_CONNECTED',
    reconnect: 'BLUETOOTH_DEVICE_RECONNECT',
    message: 'BLUETOOTH_DEVICE_MESSAGE',
  },
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
