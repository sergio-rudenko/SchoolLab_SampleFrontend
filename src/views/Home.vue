<template>
  <div class="home">
    <h1 v-if="isConnected">
      Connected to "{{ bluetoothDeviceName }}"
    </h1>
    <h1 v-else>
      Bluetooth Plugin v{{ this.$bluetooth.PluginVersion }}
    </h1>
    <h2>Температура</h2>
    <la-cartesian autoresize :height="300" :bound="[-40, 140]" :data="temperatureData">
      <la-line curve :width="4" prop="value" color="#ff0000"></la-line>
      <la-x-axis gridline prop="name"></la-x-axis>
      <!--      <la-y-axis gridline dashed :ticks="[]"></la-y-axis>-->
      <la-tooltip></la-tooltip>
      <la-y-marker dashed :value="120" label="120"></la-y-marker>
      <la-y-marker dashed :value="100" label=""></la-y-marker>
      <la-y-marker dashed :value="80" label="80"></la-y-marker>
      <la-y-marker dashed :value="60" label=""></la-y-marker>
      <la-y-marker dashed :value="40" label="40"></la-y-marker>
      <la-y-marker dashed :value="20" label=""></la-y-marker>
      <la-y-marker dashed :value="0" label="0"></la-y-marker>
      <la-y-marker dashed :value="-20" label=""></la-y-marker>
      <la-y-marker dashed :value="-40" label="-40"></la-y-marker>
    </la-cartesian>

    <h2>Относительная влажность</h2>
    <la-cartesian autoresize :height="300" :bound="[0, 110]" :data="humidityData">
      <la-line curve :width="4" prop="value" color="#0000ff"></la-line>
      <la-x-axis gridline prop="name"></la-x-axis>
      <!--      <la-y-axis gridline dashed :ticks="[]"></la-y-axis>-->
      <la-tooltip></la-tooltip>
      <la-y-marker
        v-for="(marker, i) in humidityOrdinateMarkers"
        :value="marker.value"
        :label="marker.title"
        :key="i"
        dashed
      />
    </la-cartesian>

    <h2>Уровень освещенности</h2>
    <la-cartesian autoresize :height="300" :bound="[0, 2100]" :data="lightLevelData">
      <la-line curve :width="4" prop="value" color="#f09f0a"></la-line>
      <la-x-axis gridline prop="name"></la-x-axis>
      <!--      <la-y-axis gridline dashed :ticks="[]"></la-y-axis>-->
      <la-tooltip></la-tooltip>
      <la-y-marker
        v-for="(marker, i) in lightLevelOrdinateMarkers"
        :value="marker.value"
        :label="marker.title"
        :key="i"
        dashed
      />
    </la-cartesian>

    <h2>Теспература (термопара)</h2>
    <la-cartesian autoresize :height="300" :bound="[20, 45]" :data="thermocoupleData">
      <la-line curve :width="4" prop="value" color="#f0400a"></la-line>
      <la-x-axis gridline prop="name"></la-x-axis>
      <!--      <la-y-axis gridline dashed :ticks="[]"></la-y-axis>-->

      <la-y-marker dashed :value="40" label="40"></la-y-marker>
      <la-y-marker dashed :value="30" label="30"></la-y-marker>
      <la-y-marker dashed :value="20" label="20"></la-y-marker>

    </la-cartesian>

    <button @click="connectBluetoothDevice()">Connect</button>
    <button @click="disconnectBluetoothDevice()">Disconnect</button>
    <button @click="appendData()">Append Data</button>
    <button @click="transmit()">Transmit</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters, mapMutations } from 'vuex';
// import { Cartesian, Line } from 'laue';
// import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src

export default Vue.extend({
  name: 'Home',

  mounted() {
    // let data: number;
    // data = Math.floor(Math.random() * 100) / 10 + 22.5;

    const data = {
      value: 0,
      name: '',
    };

    for (let i = 0; i < 300; i += 1) {
      this.appendTemperatureData(data);
      this.appendHumidityData(data);
    }
  },

  computed: {
    ...mapGetters({
      isConnected: 'isBluetoothDeviceConnected',
      bluetoothDeviceName: 'bluetoothDeviceName',

      temperatureData: 'DHT22_TemperatureData',
      humidityData: 'DHT22_HumidityData',

      lightLevelData: 'BH1750_LightLevelData',

      thermocoupleData: 'MAX6675_TemperatureData',
    }),
  },

  methods: {
    ...mapMutations({
      appendTemperatureData: 'appendDht22TemperatureData',
      appendHumidityData: 'appendDht22HumidityData',
    }),

    connectBluetoothDevice() {
      const BLUETOOTH_SERVICE_BIOLOGY_LAB = '0xFFEA';
      const BLUETOOTH_SERVICE_CHEMISTRY_LAB = '0xFFEB';
      const BLUETOOTH_SERVICE_PHYSICS_LAB = '0xFFEC';
      const BLUETOOTH_CHARECTERISTIC_UUID = '0xFFE0';

      this.$bluetooth.connect(
        BLUETOOTH_SERVICE_BIOLOGY_LAB,
        BLUETOOTH_CHARECTERISTIC_UUID,
      );
    },

    disconnectBluetoothDevice() {
      this.$bluetooth.disconnect();
    },

    appendData() {
      this.appendTemperatureData({
        value: Math.floor(Math.random() * 100) / 10 + 22.5,
        name: '',
      });
      this.appendHumidityData({
        value: Math.floor(Math.random() * 100) / 10 + 34.5,
        name: '',
      });
    },

    onTimer() {
      const data = new Uint8Array(5);
      data[0] = 0x81; // GET SENSORS
      data[1] = 0x05; // MAX6675 Temperature
      data[2] = 0x02; // DHT22 Temperature
      data[3] = 0x03; // DHT22 Humidity
      data[4] = 0x04; // BH1750 Light level
      this.$bluetooth.send(data);
    },

    transmit() {
      this.timer = setInterval(() => {
        this.onTimer();
      }, 200);

      // const data = new Uint8Array(5);
      // data[0] = 0x81; // GET SENSORS
      // data[1] = 0x01; // Battery voltage
      // data[2] = 0x02; // DHT22 Temperature
      // data[3] = 0x03; // DHT22 Humidity
      // data[4] = 0x04; // Light level
      // this.$bluetooth.send(data);
    },
  },

  data() {
    return {
      timer: null,
      humidityOrdinateMarkers: [
        {
          value: 0,
          title: '0 %',
        },
        {
          value: 25,
          title: '',
        },
        {
          value: 50,
          title: '50 %',
        },
        {
          value: 75,
          title: '',
        },
        {
          value: 100,
          title: '100 %',
        },
      ],
      lightLevelOrdinateMarkers: [
        {
          value: 0,
          title: '0 lx',
        },
        {
          value: 250,
          title: '',
        },
        {
          value: 500,
          title: '1000 lx',
        },
        {
          value: 750,
          title: '',
        },
        {
          value: 1000,
          title: '1000 lx',
        },
        {
          value: 1250,
          title: '',
        },
        {
          value: 1500,
          title: '1500 lx',
        },
        {
          value: 1750,
          title: '',
        },
        {
          value: 2000,
          title: '1500 lx',
        },
      ],
      // values: [
      //   {
      //     name: null,
      //     value: 0,
      //   },
      // ],
    };
  },
});
</script>

<style>
.home button {
  margin-right: 10px;
}
</style>
