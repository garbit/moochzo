const mqtt = require('mqtt')
let client = mqtt.connect('mqtt://192.168.1.2:1883')

let devices = {}

const bluetoothTimeoutPeriod = 30 // seconds

client.on('connect', () => {
  client.subscribe('bluetooth')
  client.publish('bluetooth', JSON.stringify({
    say: 'test-device',
    uuid: 'abc-123',
    address: '12:23:45:67:78:90',
    rssi: -100
  }))
  client.publish('speak', JSON.stringify({ say: 'I will only respond through this device' }))
})

client.on('message', (topic, message) => {
  // message is Buffer
  message = JSON.parse(message)
  if (topic === 'bluetooth') {
    onDeviceMessage(message)
  }
  else {
    console.log(message)
  }
  // client.end()
})

function onDeviceMessage(device) {
  if (!devices[device.address]) {
    if (!device.name) {
      device.name = 'unknown'
    }
    devices[device.address] = device
    console.log(`device joined ${device.address} ${device.rssi} ${device.name}`)
  }

  devices[device.address].lastSeenDateTime = new Date()
  devices[device.address].lastSeenEpoch = Math.round(new Date().getTime() / 1000)
}

function updateVisibleDeviceList() {
  let now = Math.round(new Date().getTime() / 1000)
  for (let deviceAddress in devices) {
    let device = devices[deviceAddress]

    let period = now - device.lastSeenEpoch
    if (period > bluetoothTimeoutPeriod) {
      // remove from device list
      console.log(`device left   ${device.address} ${device.rssi} ${device.name}`)
      delete devices[device.address]
    }
  }
}

function tick() {
  updateVisibleDeviceList()
  setTimeout(() => {
    tick()
  }, 1000)
}

function say() {
  setTimeout(() => {
    client.publish('speak', JSON.stringify({ say: 'Alert' }))
    say()
  }, 500)
}

say()
tick()
