moment().format();

"use strict";

$(function() {
  function json_ws(on_message) {

    // Try built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // Alert if no WebSocket support
    if (!window.WebSocket) {
      alert("This browser doesn\'t support WebSockets. Please use Chrome or Firefox.");
      return;
    }

    // Open socket
    var connection = new WebSocket("ws://127.0.0.1:1337");
    connection.onmessage = function(message) {
      var data;
      try {
        data = JSON.parse(message.data);
      } catch (e) {
        console.log("Invalid data: " + message.data);
        return;
      }
      if (data){
        console.log(data);
        on_message(data);
      }
    }
    window.onbeforeunload = function() {
      connection.onclose = function() {};
      connection.close();
    }

  }

  var analog_keys = ['temperature', 'smoke', 'electricity', 'motion'];
  (function() {
    function make_realtime(key) {
      var buf = [], callbacks = [];
      return {
        data: function(ts, val) {
  	  buf.push({ts: ts, val: val});
	  callbacks = callbacks.reduce(function(result, cb) {
	    if (!cb(buf))
	      result.push(cb);
	      return result
	  }, []);
        },
        add_callback: function(cb) {
	  callbacks.push(cb);
        }
      }
    };
    var realtime = {
      temperature: make_realtime('temperature'),
      smoke: make_realtime('smoke'),
      electricity: make_realtime('electricity'),
      motion: make_realtime('motion')
    };
    /* This webconnectionet sends homogenous messages in the form
     * {"solarFlare":false,"temperature":-50.68440764896562,"radiation":586,"stamp":"2016-04-06T09:44:19Z"}
     * where timestamp is a ISO 8601 datetime format
    */
    json_ws(function(data) {
      analog_keys.map(function (key) {
        console.log(data[key]);
        realtime[key].data(moment(data.stamp).valueOf(), data[key]);
      });
    });

    var context = cubism.context().step(1000).size(960);

    var metric = function (key, title) {
      var rt = realtime[key];
      return context.metric(function (start, stop, step, callback) {
        start = start.getTime();
        stop = stop.getTime();
        rt.add_callback(function(buf) {
          if (!(buf.length > 1 && 
	  buf[buf.length - 1].ts > stop + step)) {
	    // Not ready, wait for more data
	    return false;
	  }
	  var r = d3.range(start, stop, step);
	  var i = 0;
	  var point = buf[i];
	  callback(null, r.map(function (ts) {
	    if (ts < point.ts) {
	      // We have to drop points if no data is available
	      return null;
	    }
	    for (; buf[i].ts < ts; i++)
	      return buf[i].val;
	}));
	// opaque, but this tells the callback handler to
	// remove this function from its queue
	return true;
      });
    }, title);
  };
  ['top', 'bottom'].map(function (d) {
    d3.select('#charts').append('div')
      .attr('class', d + ' axis')
      .call(context.axis().ticks(12).orient(d));
  });

  d3.select('#charts').append('div').attr('class', 'rule')
    .call(context.rule());
  charts = {
    temperature: {
      title: 'temperature',
      unit: 'Fahrenheit',
      extent: [-20, 120]
    },
    smoke: {
      title: 'smoke',
      unit: 'Percentage',
      extent: [0, 100]
    },
    electricity: {
      title: 'electricity',
      unit: 'Watt',
      extent: [0, 5000]
    },
    motion: {
      motion: 'motion',
      unit: 'Bool',
      extent: [0, 1]
    }
  };
  Object.keys(charts).map(function (key) {
    var cht = charts[key];
    var num_fmt = d3.format('.3r');
    d3.select('#charts')
      .insert('div', '.bottom')
      .datum(metric(key, cht.title))
      .attr('class', 'horizon')
      .call(context.horizon()
	.extent(cht.extent).height(100)
	.title(cht.title)
	.format(function (n) { 
	  return num_fmt(n) + ' ' + cht.unit; 
	})
      );
  });

  context.on('focus', function (i) {
    if (i !== null) {
      d3.selectAll('.value').style('right',
	context.size() - i + 'px');
    } else {
      d3.selectAll('.value').style('right', null)
    }
  });
})();
});
