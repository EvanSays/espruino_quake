### Rapid Prototyping Javascript and Hardware

Written by: Evan Miller @evansays

### Introduction
Shortly after Christmas, the mail arrived with an Espruino inside. My Christmas present to myself all wrapped up in an oversized box and excessive packaging. If you were to ask me why it was difficult for me to wait a week to receive my gift, it's because of JavaScript. 

You see, in the world of micro-controllers, C#, C++ and even Java dominate. Never have I ever heard someone at the Hackaday Superconference refer to their embedded system project running because of Javascript. In fact, ever mentioning JS there would get you branded via a heated soldering iron. 

On Instagram, I follow [@brendandawes](http://instagram.com/@brendandawes). He lives out in the UK and from his IG, he's an "artist working with digital and analogue materials". He periodically posts what he uses for his projects, including the one that got me all antsy waiting for the mail arrive. JS + embedded systems? Yes, please!

<img src="https://github.com/EvanSays/espruino_quake/blob/master/media/brendan_dawes_ig.png" width="600">

I'm all in for rapid prototyping. The moment I have an idea, I want to create. The less the upfront cost of time, the closer to an idea coming to fruition. The Espruino brands itself as being easy to setup, program, and debug. Cue, easy button commercial. Let's see how this goes.

### The Idea.

My idea this time is to create a device that lights up when an earthquake is sensed around the world. I would fetch the USGS API using the built-in WiFi module and parse through the quakes. If one is large enough, LEDs would blink and change color according to magnitude.

To make this work, I will need an Espruino, LEDs, a breadboard, and a micro USB. It so happens, I have these lying around.

<img src="https://github.com/EvanSays/espruino_quake/blob/master/media/parts.jpg" width="600">


### Setup / Internet Connection.

Downloading their custom IDE from the Chrome store was painless. Connecting to the Espruino was a breeze via USB. All I had to do was plug it in and find the connection link in the top right corner of the screen. Reading through the docs, I found that I could run JS in realtime straight from the IDE console. 1+1 = 2, check. I'd compare it to writing code in the dev tools in Chrome. Pretty friggin cool.

<img src="https://github.com/EvanSays/espruino_quake/blob/master/media/connected.png" width="300">


Okay, let's get this puppy connected to the internet. Shoot! I hit my first snag here. I later learned that Espruinos WiFi chip, the ESP8266 will only work with wifi that is in the 2.4Ghz range and not 5Ghz. Why was this not in their docs, who knows? I'll create a pull request. Here's the code I used to test the wifi.

[Why Cant ESP8266 Operate In 5Ghz?](http://www.esp8266.com/viewtopic.php?f=6&t=4032)

```javascript
var WIFI_NAME = "";
var WIFI_OPTIONS = { password : "" };

var wifi = require("EspruinoWiFi");
wifi.connect(WIFI_NAME, WIFI_OPTIONS, function(err) {
  if (err) {
    console.log("Connection error: "+err);
    return;
  }
  console.log("Connected!");
  getPage();
});

function getPage() {
  require("http").get("http://www.pur3.co.uk/hello.txt", function(res) {
    console.log("Response: ",res);
    res.on('data', function(d) {
      console.log("--->"+d);
    });
  });
}
```

### Fetching USGS data.

The code example above used the [http library](http://www.espruino.com/Reference#http) to fetch the contents from a webpage. Looking at the docs, I found that's exactly what I wanted to do, grab the contents of the [USGS hourly results](https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson), then [JSON.parse](http://www.espruino.com/Reference#JSON) the results. 

```javascript
function getData() {
  require("http").get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", function(res) {
    var data = "";
    console.log("Response: ",res);
    res.on('data', function(d) { data += d; });
    res.on('close', function() { 
      var json = JSON.parse(data);
      parseFeatures(json.features);
    });
  });
}
```

### Parse the data.

The [USGS Webite](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) provided some good docs on the output of their GeoJSON summary. After poking through, I found my interest was in the "features" array and more specifically, the magnitude. The value for mag ranges from [-1, 10] and comes from the U.S Geological Surveys official report. It's the size of the quake at the source. [More info here](https://earthquake.usgs.gov/data/comcat/data-eventterms.php#mag).

Note: They update the GeoJSON every 5 minutes and clear it on the hour.

```javascript
// Parse through the array of features

function parseFeatures(features) {
  magParse(features[0].properties.mag);
}

function magParse(mag) {
  if (mag <= 2) {
    //console.log("ONE " + mag);
  } else if (mag > 2 && mag <= 4) {
    //console.log("TWO " + mag);
  } else if (mag > 4 && mag <= 6) {
    console.log("THREE " + mag);
  } else if (mag > 6 && mag <= 8) {
    console.log(mag);
  } else if (mag > 8 && mag <= 10) {
    console.log(mag);
  }
}
```

### Blinky Time

For this project, I decided to use WS2812b LEDs. They are branded as "Neopixels" or "5050". Still all the same. What makes them so cool is that we can control each pixel on the strip individually or all together use a data line, ground, and 5v. 

Espruino gives us a badass library to help us with the data flow to the LEDs, called [Neopixel](http://www.espruino.com/Reference#neopixel).

I set 12 total LEDs to a global var name RGB. Note that although I have 12 LEDs, there are 12 x 3 addresses. Why tho? That's because of RGB. Say I wanted only the red on the first LED on. [255, 0, 0]. Say I wanted Red on the first and Blue on the second LED. [255, 0, 0, 0, 0, 255].

The line 

```javascript
require("neopixel").write(B15, rgb);
```
writes the number of total leds (rgb) to the B15 pin. See pinout [here](http://www.espruino.com/WiFi).

Next, I attached the 5v led pad --> VUSB, GND --> GND and Data --> Data

<img src="https://github.com/EvanSays/espruino_quake/blob/master/media/hookup.png" width="600">

```javascript
// For a sparkling blue effect

var rgb = new Uint8ClampedArray(9);

function doLights() {
  getPattern();
  require("neopixel").write(B15, rgb);
}

function getPattern() {
  for (var i=0;i<rgb.length;i+=3) {
     rgb[i  ] = 0;
     rgb[i+1] = 0;
     rgb[i+2] = Math.random()*255;
  }
}

setInterval(doLights,50);
```

Sidenote: Neopixel was coined by a company name Adafruit. They sell and create open source hardware/software for makers, in NYC. [Check them out.](https://www.adafruit.com/) I'm not affiliated with them in any way. 

### Blinky Control Timer

The LEDs won't turn off now with the setInterval. What we need to do is create a timer that for 2 seconds, will run the setInterval. In the end, we also need to clear the LEDs to zero out. Otherwise, they will stay lit. 

```javascript
function timer() {
  var timerId = setInterval(function(){
    doLights();
  },50);

  setTimeout(function(){
    clearInterval(timerId);
    
    // Set the LEDS to zero
    require("neopixel").write(B15, [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  },3000);
}
```

### All Together Now

<img src="https://github.com/EvanSays/espruino_quake/blob/master/media/blink_blue.GIF" width="300">
<img src="https://github.com/EvanSays/espruino_quake/blob/master/media/blink_purp.GIF" width="300">

[Link to full code](https://github.com/EvanSays/espruino_quake/blob/master/quake.js)

Putting all the code pieces together lets me grab data from the API, parse through it for magnitude, and depending on the range, flashes the LEDs a color. All in all, I'm quite pleased with the whole process of building from scratch. The custom IDE made it a breeze to get up and running fast, along with the ability to code there and see changes in realtime.

A project is not a project without some pitfalls. I did get stuck on figuring out how to JSON.parse the API. I also got stuck dealing with memory issues. Where's the leak!? I may never know... However, all in all the docs were well written and provided a great deal of information when I became stuck. 

As far as using JavaScript for this project, I am pumped. If I were to write this in another embedded language, it would've taken longer because I do not use those languages regularly. I'd say if you feel most comfortable coding in JS, try looking through Espruinos tutorials on their website to see if something catches your eye. Another cool product they make is a Bluetooth enabled button. In about an hour, I programmed mine to play/pause/skip music on my phone so that I could place it in my glove during snowboarding. That tutorial is for another time. My point is build something wicked.

Come find me on ig @_evansays
