// Simple test script based on the govee-lan-control examples (which are buggy)
//
const Govee = require("govee-lan-control");

var govee = new Govee.default();
govee.on("ready", () => {
  console.log("Server/client is ready!");
});
govee.on("deviceAdded", (device) => {
  console.log("New Device!", device.model);
  device.actions.setOn();

  setInterval(() => {
    device.actions.fadeColor({
      time: 2000,
      color: {
        hex: Math.floor(Math.random() * 16777215).toString(16),
      },
      brightness: Math.random() * 100,
    });
  }, 2000);
});



