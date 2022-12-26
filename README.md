# govee-lan-server
Node.js web server for controlling Govee lighting devices via their local LAN API   

# What it does
Govee-lan-server is a lightweight web server that can handle a few simple actions for controlling one or more Govee lights. This uses their new local LAN API, via the [Govee-lan-control](https://github.com/Joery-M/Govee-LAN-Control) Node library. It does NOT use Govee's remote API or BLE; it must run within the device's LAN.

All of this could be done in standalone scripts (per the examples in [Govee-lan-control](https://github.com/Joery-M/Govee-LAN-Control)'s documentation), but I wanted an always-on event listener to reduce latency caused by the startup "discovery" phase. Using a web server is the easiest way to make it reachable from the separate system that will be controlling it (a rooted Philips Hue hub). I use a Philips Hue dimmer switch control my Govee lights, using a Python script I wrote that runs on a rooted Hue: [hue-jazz](https://github.com/20goto10/hue-jazz/). You could also issue the same requests from other home automation software. 

I will likely abandon this project as soon as there is a good OpenHAB binding for these kinds of light strips.

# Warning!
Don't run this on a publicly accessible server, unless you know what you're doing. There's no access control, and I don't want to be responsible for any involuntary lightshows. The risk of a serious hack is pretty small but I'd rather not be responsible for any part of it.

# How to do it

0. You'll need a modern version of Node.js. I'm on 16 but older versions would probably work. Assuming that's taken care of--
```
git clone https://github.com/20goto10/govee-lan-server
cd govee-lan-server
npm install
cp config.json.sample config.json
```


1. Make sure you have the Govee "LAN Control" option in Govee's confusing app. This is not a straightforward matter. I had to try several things to wake this up. I'm not sure what eventually got it to work, but it might be the tip I found on Reddit to link the device to your phone's wi-fi hotspot. I also deleted and reset the device, power-cycled it numerous times, and restarted the app numerous times. All I can say for sure is that I have an H61E1 and it did eventually work. Why the LAN Control option is not visibile by default, or easy to enable, is anyone's guess. If you unplug it and plug it back in 30 minutes later as the Govee docs suggest, you have probably just wasted 30 minutes.

2. Edit `config.json` and map device IDs to whatever device nicknames you wish to use. If you're not sure of the device ID, just launch the server (per the next step). When the server discovers a device, it will print out the ID. Use that as a key in the 'device_map' section of the JSON config, with any nickname you like for the value. 

The rest of the config, currently, is just a port setting for your server (default should be fine) and a default_fade_time if you want to fade colors over time (based on the examples from [Govee-lan-control](https://github.com/Joery-M/Govee-LAN-Control)), which can be left as-is. 

(I realize the device nicknames aren't really necessary but I prefer having a human-readable identifier in the URL so I understand my automations later. The config also makes it possible to avoid providing control of any devices you want to omit, for whatever reason may someday arise. I only have one Govee device in service so in my case it's a moot point.)

3. Once you have your config map set up, start the app.
```
node govee-lan-server.js
````


4. Once the app is set up, you can trigger the HTTP requests however you like (e.g. from curl, or a browser). Supposing it's running at 192.168.1.230, on the default port of 3666, and your device nickname in the device_map is "lightstrip".

5. (optional) A systemd service daemon script is included in the `service` directory. It must be updated and copied to the correct location. See README in that directory.

Turn it on:

`curl http://192.168.1.230:3666?device=lightstrip&action=on`

Turn it off:

`curl http://192.168.1.230:3666?device=lightstrip&action=off`

Set the brightness (in this case to 50%). The brightness scale is 0-100.

`curl http://192.168.1.230:3666?device=lightstrip&action=brightness&value=50`

Raise or lower the brightness relatively up or down by a given amount with the "delta" param: reads the brightness value and adjusts accordingly, by percentage (of the maximum). Use negative numbers to decrease. Here we lower it by 5%:

`curl http://192.168.1.230:3666?device=lightstrip&action=brightness&delta=-5`

Set the color, in this case, to 100% green-ness. The "%23" entity makes the # symbol.

`curl http://192.168.1.230:3666?device=lightstrip&action=color&value=%2300FF00`

Fade the color, in this case, to pale blue, with a 3 second fade time (note that if "fade" is not supplied, it will use the default from config).

`curl http://192.168.1.230:3666?device=lightstrip&action=color&value=%23DDFFDD&fade=3000`

Note that if running these curl commands in a terminal you will need to escape the & characters (i.e. change them to "\&").

That's pretty much it.  Valid actions are:
```
on
off
color
brightness
fadecolor
```


# Contributing
Please, feel free. My apologies for any sloppy code or Node offenses-- this is something I hacked together in a couple hours in vi on a Raspberry pi.

# Road map

- *RGBIC control?*
If there is some way of taking advantage of the RGBIC features I'd love to know about it. It's hardly urgent, and I won't be the one to figure that out. Honestly I don't really care about the animations-- I use the strip like track lighting, and can use their insanely complex app when I feel like setting a Halloween theme or something.
- *de-sillification*
There's some half-baked stuff in here. For example, there's no real need for an "action" parameter at all. The whole operation could be done by the request payload. Nicknames are pointless. The config is case-sensitive about IDs. Etc. Maybe I'll bother de-sillifying it.

# Thank you
I did the easy work, not the hard work. The hard work was done by [Joery-M](https://github.com/Joery-M), namely their [Govee-lan-control](https://github.com/Joery-M/Govee-LAN-Control) project. Many thanks, Joery-M!

Thank you to Govee for finally adding this LAN control feature. This has the side-effect of taking a cheap light strip and turning it into a cheap good one.

# Ranting
All home automation devices should have a full, local API. The trend of having them doing *anything* over the internet, except voluntary upgrades, has always struck me as insane. 

