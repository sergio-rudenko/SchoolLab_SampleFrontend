/* eslint-disable no-param-reassign */

// import { Vue as _Vue } from 'vue';
//
// export type PluginFunction<T> = (Vue: typeof _Vue, options?: T)  => void;
//
// export interface PluginObject<T> {
//   install: PluginFunction<T>,
//   [key: string]: any;
// }

import _Vue from 'vue';
import store from '@/store';

const MUTATUIN_PREFIX = 'BLUETOOTH_DEVICE';

export default function install(Vue: typeof _Vue, options?: any): void {
  if (!('bluetooth' in navigator)) {
    console.error('No bluetooth available!');
    return;
  }

  Vue.prototype.$bluetooth = {
    PluginVersion: '0.1.0',

    device: null,
    characteristic: null,

    serviceUUID: null,
    characteristicUUID: null,

    /* Reconnect to remote bluetooth device, true by default */
    reconnection: (options && 'reconnect' in options) ? options.reconnect : true,

    action: options?.action || {},
    mutation: options?.mutation || {},
  };

  /* Store for dispatch/commit events */
  Vue.prototype.$bluetooth.store = (options && 'store' in options) ? options.store : null;

  /**
   * Event listener function (bound to context)
   */
  Vue.prototype.$bluetooth.$onGattServerDisconnected = (function (event) {
    const device = event.target;
    // console.log(`"${device.name}" bluetooth device unexpectedly disconnected!`);
    if (this.reconnection) {
      // console.log('Attempting to reconnect...');
      this.$emitEvent('reconnect', device);

      if (this.characteristic) {
        // console.log('Remove "characteristicvaluechanged" event listener');
        this.characteristic.removeEventListener(
          'characteristicvaluechanged',
          this.onCharacteristicValueChanged,
        );
        this.characteristic = null;
      }

      this.$getCharacteristic(device, this.characteristicUUID)
        .then((characteristic) => this.$startNotifications(characteristic))
        .catch((error) => {
          console.error(error);
          this.disconnect();
        });
    } else {
      this.disconnect();
    }
  }).bind(Vue.prototype.$bluetooth);

  /**
   * Event listener function (bound to context)
   */
  Vue.prototype.$bluetooth.$onCharacteristicValueChanged = (function (event) {
    // const data = new Uint8Array(event.target.value.buffer);
    const data = event.target.value;
    this.$emitEvent('message', data);
  }).bind(Vue.prototype.$bluetooth);

  /**
   *
   * @param eventName
   * @param data
   */
  Vue.prototype.$bluetooth.$emitEvent = function (eventName: string, data: null) {
    const context = Vue.prototype.$bluetooth;
    // console.log(eventName, data);
    if (context.store) {
      const {
        commit,
        dispatch,
      } = context.store;

      if (eventName in context.action) {
        dispatch(context.action[eventName], data);
      }
      if (eventName in context.mutation) {
        commit(context.mutation[eventName], data);
      }
    }
  };

  /**
   * Internal function
   * @param {string} serviceUUID
   */
  Vue.prototype.$bluetooth.$getDevice = function (serviceUUID: string) {
    const context = Vue.prototype.$bluetooth;
    if (context.device) {
      return Promise.resolve(context.device);
    }
    // console.log('Requesting bluetooth device...');
    context.serviceUUID = Number(serviceUUID);
    return navigator.bluetooth
      .requestDevice({
        filters: [{ services: [context.serviceUUID] }],
      })
      .then((device) => {
        if (context.device === null) {
          // console.log(`"${device.name}" bluetooth device selected`);
          context.device = device;
          context.device.addEventListener(
            'gattserverdisconnected',
            context.$onGattServerDisconnected,
          );
        }
        return context.device;
      });
  };

  /**
   * Internal function
   * @param {object} device
   * @param {string} characteristicUUID
   */
  Vue.prototype.$bluetooth.$getCharacteristic = function (
    device = null, characteristicUUID: string,
  ) {
    const context = Vue.prototype.$bluetooth;

    if (context.device && context.device.gatt.connected && context.characteristic) {
      return Promise.resolve(context.characteristic);
    }

    if (device === null) {
      return Promise.resolve(null);
    }

    // console.log('Connecting to GATT server...');
    return device.gatt
      .connect()
      .then((server) => server.getPrimaryService(context.serviceUUID))
      .then((service) => service.getCharacteristic(context.characteristicUUID))
      .then((characteristic) => {
        // console.log('Characteristic found.');
        context.characteristic = characteristic;
        return context.characteristic;
      });
  };

  /**
   * Internal function
   * @param {object} characteristic
   */
  Vue.prototype.$bluetooth.$startNotifications = function (characteristic: null) {
    const context = Vue.prototype.$bluetooth;

    if (characteristic === null) {
      return Promise.resolve(null);
    }

    // console.log('Starting notifications...');
    return characteristic
      .startNotifications()
      .then(() => {
        if (context.characteristic.oncharacteristicvaluechanged === null) {
          // console.log('Notifications started');
          context.characteristic.addEventListener(
            'characteristicvaluechanged',
            context.$onCharacteristicValueChanged,
          );
        }
        context.$emitEvent('connected', context.device);
      });
  };

  /**
   * Connect to remote bluetooth device, add event listeners
   * @param {string} serviceUUID
   * @param {string} characteristicUUID
   */
  Vue.prototype.$bluetooth.connect = function (
    serviceUUID: string,
    characteristicUUID: string,
  ) {
    const context = Vue.prototype.$bluetooth;
    context.serviceUUID = Number(serviceUUID);
    context.characteristicUUID = Number(characteristicUUID);

    return context
      .$getDevice(serviceUUID)
      .then((device) => context.$getCharacteristic(device, characteristicUUID))
      .then((characteristic) => context.$startNotifications(characteristic))
      .catch((error) => {
        console.error(error);
        context.disconnect();
      });
  };

  /**
   * Disconnect from remote bluetooth device, remove event listeners
   */
  Vue.prototype.$bluetooth.disconnect = function () {
    const context = Vue.prototype.$bluetooth;
    if (context.characteristic) {
      // console.log('Remove "characteristicvaluechanged" event listener');
      context.characteristic.removeEventListener(
        'characteristicvaluechanged',
        context.$onCharacteristicValueChanged,
      );
      context.characteristic = null;
    }
    if (context.device) {
      // const { name } = context.device;
      // console.log('Remove "gattserverdisconnected" event listener');
      context.device.removeEventListener(
        'gattserverdisconnected',
        context.$onGattServerDisconnected,
      );
      if (context.device.gatt.connected) {
        context.device.gatt.disconnect();
        // console.log(`"${name}" bluetooth device disconnected`);
        // } else {
        //   console.log(`"${name}" bluetooth device is already disconnected`);
      }
      context.$emitEvent('disconnected', context.device);
      context.device = null;
    }
    context.serviceUUID = null;
    context.characteristicUUID = null;
    // console.log('Remote device disconnected.');
  };

  Vue.prototype.$bluetooth.send = function (data: Uint8Array) {
    const context = Vue.prototype.$bluetooth;
    if (context.device && context.device.gatt.connected) {
      // console.log(context.device);
      if (context.characteristic) {
        context.characteristic
          .writeValueWithoutResponse(data)
          .then(() => {
            // console.log(`Transmitted data: ${data.byteLength} bytes, index: ${data[0]}`);
          })
          .catch((error) => {
            console.log('Can`t transmit data:');
            console.error(error);
          });
      }
    }
  };

  Vue.mixin({
    // created() {},
  });
}
