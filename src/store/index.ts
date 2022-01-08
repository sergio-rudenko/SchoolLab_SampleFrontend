import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    bluetoothDeviceConnected: false,
    bluetoothDeviceReconnectCount: 0,
    bluetoothDeviceName: null,

    message: null,
    timestamp: 0,

    avgTime: 0,
    avgFreq: 0,

    DHT22: {
      Temperature: [
        {
          name: null,
          value: 0,
        },
      ],
      Humidity: [
        {
          name: null,
          value: 0,
        },
      ],
    },
    BH1750: {
      LightLevel: [
        {
          name: null,
          value: 0,
        },
      ],
    },
    MAX6675: {
      Temperature: [
        {
          name: null,
          value: 0,
        },
      ],
    },
  },

  getters: {
    isBluetoothDeviceConnected: (state) => state.bluetoothDeviceConnected,
    bluetoothDeviceName: (state) => state.bluetoothDeviceName,

    DHT22_TemperatureData: (state) => state.DHT22.Temperature,
    DHT22_HumidityData: (state) => state.DHT22.Humidity,

    BH1750_LightLevelData: (state) => state.BH1750.LightLevel,

    MAX6675_TemperatureData: (state) => state.MAX6675.Temperature,
  },

  mutations: {
    appendDht22TemperatureData(state, data) {
      state.DHT22.Temperature.push(data);
      if (state.DHT22.Temperature.length > 300) {
        state.DHT22.Temperature.shift();
      }
    },

    appendDht22HumidityData(state, data) {
      state.DHT22.Humidity.push(data);
      if (state.DHT22.Humidity.length > 300) {
        state.DHT22.Humidity.shift();
      }
    },

    BLUETOOTH_DEVICE_MESSAGE(state, data) {
      const UPLINK_SENSOR_TYPE_BATTERY_VOLTAGE = 0x01;
      const UPLINK_SENSOR_TYPE_DHT22_TEMPERATURE = 0x02;
      const UPLINK_SENSOR_TYPE_DHT22_HUMIDITY = 0x03;
      const UPLINK_SENSOR_TYPE_BH1750_LIGHT_LEVEL = 0x04;
      const UPLINK_SENSOR_TYPE_MAX6675_THERMOCOUPLE = 0x05;

      if (state.bluetoothDeviceConnected) {
        // console.log('received:', data);
        state.message = data;

        if (data.byteLength === 20) {
          for (let i = 0; i < 4; i += 1) {
            const sensorType = data.getUint8(i * 5);
            const sensorValue = data.getFloat32((i * 5) + 1, true);
            if (sensorType === UPLINK_SENSOR_TYPE_DHT22_TEMPERATURE) {
              state.DHT22.Temperature.push({
                value: sensorValue,
                name: '',
              });
              if (state.DHT22.Temperature.length > 300) {
                state.DHT22.Temperature.shift();
              }
            } else if (sensorType === UPLINK_SENSOR_TYPE_DHT22_HUMIDITY) {
              state.DHT22.Humidity.push({
                value: sensorValue,
                name: '',
              });
              if (state.DHT22.Humidity.length > 300) {
                state.DHT22.Humidity.shift();
              }
            } else if (sensorType === UPLINK_SENSOR_TYPE_BH1750_LIGHT_LEVEL) {
              state.BH1750.LightLevel.push({
                value: sensorValue,
                name: '',
              });
              if (state.BH1750.LightLevel.length > 300) {
                state.BH1750.LightLevel.shift();
              }
            } else if (sensorType === UPLINK_SENSOR_TYPE_MAX6675_THERMOCOUPLE) {
              state.MAX6675.Temperature.push({
                value: sensorValue,
                name: '',
              });
              if (state.MAX6675.Temperature.length > 300) {
                state.MAX6675.Temperature.shift();
              }
            } else {
              // console.log('sensor Type:', sensorType);
              // console.log('sensor Value:', sensorValue);
            }
          }
        }

        state.timestamp = Date.now();
        // console.log('received:', data.getUint32(0, true));
      }
    },

    BLUETOOTH_DEVICE_CONNECTED(state, device) {
      if (state.bluetoothDeviceName !== device.name) {
        state.bluetoothDeviceName = device.name;
        state.bluetoothDeviceReconnectCount = 0;
      }
      state.bluetoothDeviceConnected = true;
    },

    BLUETOOTH_DEVICE_DISCONNECTED(state) {
      state.bluetoothDeviceName = null;
      state.bluetoothDeviceConnected = false;
      state.bluetoothDeviceReconnectCount = 0;
    },

    BLUETOOTH_DEVICE_RECONNECT(state) {
      state.bluetoothDeviceConnected = false;
      state.bluetoothDeviceReconnectCount += 1;
    },
  },
  actions: {},
  modules: {},
});
