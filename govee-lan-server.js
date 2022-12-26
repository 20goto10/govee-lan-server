// To fix: 
//   Startup issues (infrequent):
//   - sometimes the server seems to hang at startup.
//   - sometimes the device doesn't show up to register itself, for no known reason. 

const http = require("http");
const fs = require('fs');
const url = require('url');
const Govee = require("govee-lan-control");

var config = { port: 3666, // default, can be overridden in config
               default_fade_time: 1000 } // for fadecolor; can be overridden in URL
const config_file_name = 'config.json';
const VALID_ACTIONS = ['on', 'off', 'brightness', 'color', 'fadecolor'];

var govee = new Govee.default();
var devices = {};

const handle_action = (govee_device, nickname, action, params) => {
  switch(action) { 
    case 'on': govee_device.actions.setOn();
	       return { message: "turned on " + nickname + " (" + govee_device.deviceID + ")" };
	       break;
    case 'off': govee_device.actions.setOff();
	        return { message: "turned off " + nickname + " (" + govee_device.deviceID + ")" };
	        break;
    case 'brightness': if (params['value']) {
	                 govee_device.actions.setBrightness(params.value);
	                 return { message: "set " + nickname + " brightness to " + params.value + " (" + govee_device.deviceID + ")" };
	               } 
		       else if (params['delta']) {
                         var current_brightness = govee_device.state.brightness;
			 var delta = parseInt(params['delta']);
                         var new_brightness = current_brightness + delta;
                         if (new_brightness > 100) {
				 new_brightness = 100;
			 } else if (new_brightness < 0) {
				 new_brightness = 0;
			 }
	                 govee_device.actions.setBrightness(new_brightness);
	                 return { message: "adjust " + nickname + " brightness by " + delta + "%, from " + current_brightness + " to " + new_brightness + " (" + govee_device.deviceID + ")" };
		       }
	               else {
			 return { error: "brightness needs a 'value' or 'delta' setting" };
		       }
	               break;
    case 'color': if (params['value']) {
	            govee_device.actions.setColor({ hex: params.value });
	            return { message: "set " + nickname + " color to " + params.value + " (" + govee_device.deviceID + ")" };
	          }
	          else {
	            return { error: "color needs a 'value' setting (a hex RGB string prefixed with #, like '#abc123')" };
		  }
		  break;
    case 'fadecolor': if (params['value']) {
	            var fade_time = config['default_fade_time'];
	            var param_note = '(config default_fade_time) ';
	            if (params['time']) {
	              fade_time = params.time;
		      param_note = "(time from request) ";
                    }
	            var options = { color: { hex: params.value }, 
		                    time: fade_time };
	            if (params['brightness']) {
		      // It doesn't really make sense to have a brightness
		      // AND a hex code for the color, but, the option is 
		      // there in the lib, so who am I to say you can't do it.

	              options['brightness'] = params.brightness;
		      param_note += "brightness " + params.brightness;
                    }
	            govee_device.actions.fadeColor(options);
	            return { message: "fading " + nickname + " color to " + params.value + " over " + fade_time + "msec " + param_note + " (" + govee_device.deviceID + ")" };
	          }
	          else {
	            return { error: "color needs a 'value' setting (a hex RGB string prefixed with #, like '#abc123')" };
		  }
		  break;
  }
  return { error: "unknown" };
};

const parse_request = (queryObject) => {
  if (queryObject.device) { 
    if (devices[queryObject.device]) {
      if (queryObject.action) {
	if (VALID_ACTIONS.indexOf(queryObject.action) != -1) { 
          return handle_action(devices[queryObject.device], queryObject.device, queryObject.action, queryObject);
	}
	else {
	  return { error: "requested action " + queryObject.action + " is not a valid action; valid actions are: " + VALID_ACTIONS.join(',') };
	}
      } else {
	return { error: "no action in URL query" };
      }
    } else {
      return { error: "device " + queryObject.device + " is not known (yet?); make sure it has a value in the config.json 'device_map' object" };
    }
  } else {
    return { error: "no device in URL query" };
  }
  return {};
};

const server = http.createServer((req, res) => {
  const queryObject = url.parse(req.url, true).query;
  parsed_request = parse_request(queryObject);
  if (parsed_request['error']) {
    res.writeHead(400, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(parsed_request));
  } else {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(parsed_request));
  }
  res.end();
});

const start_server = () => {
  fs.readFile(config_file_name, 'utf8', (err, data) => {
    if (err) {
      console.log(`Error reading file from disk: ${err}`)
    } else {
      // merge existing default config with whatever is in the file
      Object.assign(config, JSON.parse(data));
      // TODO: should really make the device keys case-insensitive...
	    
      console.log("Config: ", config);

      govee.on("deviceAdded", (device) => {
        console.log("Found new device:", device.deviceID, "ip address: ", device.ip, "model:", device.model);
        // console.log("Full device map:", device);
        if (config['device_map'] && config['device_map'][device.deviceID]) {
          console.log("Device " + device.deviceID + " is mapped to name " + config['device_map'][device.deviceID]);
          devices[config['device_map'][device.deviceID]] = device;
	} else {
          console.log("Could not find device " + device.deviceID + " in config['device_map'] (this could be a matter of case sensitivity); ignoring device");
	}
      });
 
      server.listen((config['port']), () => {
        console.log("Server is running on Port " + config['port']);
      })
    }
  })
};

govee.on("ready", () => {
  console.log("Govee listener is ready; starting web server");
  start_server();
});

