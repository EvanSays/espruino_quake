var WIFI_NAME = "";
var WIFI_OPTIONS = { password: "" };

var rgb = new Uint8ClampedArray(9 * 3);
var pos = 0;

var wifi;

// to use onInit, in the ide, go to settings --> Communications --> Save On Send = (yes)
function onInit() {
  wifi = require("EspruinoWiFi");
  wifi.connect(WIFI_NAME, WIFI_OPTIONS, function(err) {
    if (err) {
      console.log("Connection error: "+err);
      return;
    }
    console.log("Connected!");
    startInterval();
  });
}

function startInterval() {
    getData();

    setInterval(function () {
        getData();
    }, 300000);
}

function getData() {
    var usage = process.memory().usage;
    // Uncomment to check memory usage for debugging
    console.log('USAGE- ' + usage);
    require("http").get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", function (res) {
        var data = "";
        //console.log("Response: ",res);
        res.on('data', function (d) { data += d; });
        res.on('close', function () {
            var json = JSON.parse(data);
            parseFeatures(json.features);
        });
    });
}


function parseFeatures(features) {
    magParse(features[0].properties.mag);
}

function magParse(mag) {
    if (mag <= 2) {
        timer(0,1,2,3,4,5,0,0,100);
    } else if (mag > 2 && mag <= 4) {
        timer(0, 1, 2, 3, 4, 5, 0, 50, 75);
    } else if (mag > 4 && mag <= 6) {
        timer(0, 1, 2, 3, 4, 5, 0, 75, 75);
    } else if (mag > 6 && mag <= 8) {
        timer(0, 1, 2, 3, 4, 5, 0, 110, 110);
    } else if (mag > 8 && mag <= 10) {
        timer(0, 1, 2, 3, 4, 5, 0, 255, 0);
    }
}

function timer(led1, led2, led3, led4, led5, led6, red, grn, blue) {
    var timerId = setInterval(function () {
        doLights(led1, led2, led3, led4, led5, led6, red, grn, blue);
    }, 50);

    setTimeout(function () {
        clearInterval(timerId);
        require("neopixel").write(B15, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }, 2000);
}

function doLights(one, two, three, four, five, six, red, grn, blue) {
    getPattern(one, two, three, four, five, six, red, grn, blue);
    require("neopixel").write(B15, rgb);
}

function getPattern(one, two, three, four, five, six, red, grn, blue) {
    for (var i = 0; i <= rgb.length; i += 3) {
        rgb[one + i] = Math.random() * red;
        rgb[two + i] = Math.random() * grn;
        rgb[three + i] = Math.random() * blue;
    }
}
