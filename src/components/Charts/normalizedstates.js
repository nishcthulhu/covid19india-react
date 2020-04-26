import React, {useState, useCallback, useRef, useMemo, useEffect} from 'react';
import {useEffectOnce, useLocalStorage, useFavicon} from 'react-use';

import * as d3 from 'd3';
import moment from 'moment';

import {
  sliceTimeseriesFromEnd,
  formatNumber,
} from '../../utils/commonfunctions';
import {useResizeObserver} from '../../utils/hooks';

const accumulateData = (data) => {
  let cumulativeData = [];
  let temp = [];
  let slice = [];
  let value = 0;
  let i = 0;

  cumulativeData = data.map((obj, index, arr) => {
    temp[index] = {};
    Object.keys(obj).forEach((key) => {
      if (key === 'status') {
        return;
      }
      if (key === 'date') {
        value = moment(obj[key], 'DD-MMM-YY');
      } else {
        i = index;
        let sum = 0;
        while (i >= 0) {
          sum += parseInt(arr[i][key]) || 0;
          i--;
        }
        value = parseInt(sum) || 0;
      }
      temp[index] = {...temp[index], [key]: value};
    });
    return temp[index];
  });
  return cumulativeData;

  /*let cumulativeData = {};
	data.forEach((fD, index) => {
		Object.keys(fD).forEach((key) => {
			if (cumulativeData[key] === undefined) {
				cumulativeData[key] = [] ;
  			}
			if (key === 'status' || key === 'date' ) {
				return;
			}
      		if (index === 0) {
      			cumulativeData[key][index] = parseInt(fD[key]) || 0;	
      		} else {
      			cumulativeData[key][index] = 
      			cumulativeData[key][index-1] + (parseInt(fD[key]) || 0);	
      		}
		})
	})
	return cumulativeData;*/
};

const smoothened = (data, N) => {
  let cumulativeData = [];
  let temp = [];
  let slice = [];
  let value = 0;
  let i = 0;

  cumulativeData = data.map((obj, index, arr) => {
    slice = arr.slice(index, index + N);
    if (index < arr.length - N + 1) {
      temp[index] = {};
      Object.keys(obj).forEach((key) => {
        if (key === 'status') {
          return;
        }
        if (key === 'date') {
          value = moment(obj[key], 'DD-MMM-YY');
        } else {
          i = N - 1;
          let sum = 0;
          while (i >= 0) {
            sum += parseInt(slice[i][key]) || 0;
            i--;
          }
          value = parseInt(sum / N) || 0;
        }
        temp[index] = {...temp[index], [key]: value};
      });
      return temp[index];
    } else {
      return;
    }
    return;
  });
  return cumulativeData;
};

const repositioned = (data, threshold) => {
  let cumulativeData = {};
  Object.keys(data).forEach((key) => {
    data[key].forEach((value, index) => {
      if (cumulativeData[key] === undefined) {
        cumulativeData[key] = [];
      }
      if (data[key][index] >= threshold) {
        cumulativeData[key] = [...cumulativeData[key], data[key][index]];
      }
    });
  });
  return cumulativeData;
};

function NormalizedStates(props) {
  const filterData = props.data
    .filter((object) => {
      return object.status === 'Confirmed';
    })
    .sort((a, b) => {
      return moment(a.date, 'DD-MMM=YY') - moment(b.date, 'DD-MMM=YY');
    });
  const [cumulativeData, dates] = useMemo(() => {
    //const cumulativeData = repositioned (smoothened((accumulateData(filterData)),3),10);
    //const cumulativeData = smoothened((accumulateData(filterData)),3);
    const dates = filterData.map((x) => moment(x.date, 'DD-MMM-YY'));
    //console.log (cumulativeData);
    return [[], dates];
  }, [filterData]);
  const temp = accumulateData(
    smoothened(filterData, 1).filter((obj) => {
      return obj !== undefined;
    })
  );

  const graphData = useCallback(() => {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
      width = 1000 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;
    const keys = Object.keys(temp[0]);
    const hues = new Map(keys.map((d) => [d, Math.floor(Math.random() * 360)]));
    console.log(temp);
    const xScale = d3.scaleTime().domain(d3.extent(dates)).range([0, width]);

    const yScale = d3
      .scaleLog()
      .clamp(true)
      .domain([50, 28000])
      .rangeRound([height, 0]);

    const yaxis = d3.axisLeft().scale(yScale);
    const xaxis = d3.axisBottom().scale(xScale);

    var svg = d3
      .select('#chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('fill', 'red')
      .style('color', 'blue')

      .style('color', 'blue')
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg
      .append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xaxis);

    svg.append('g').attr('class', 'axis').call(yaxis);

    keys.forEach((key, index) => {
      if (key === 'date' || key === 'status') {
        return;
      } else {
        svg
          .append('path')
          .datum(temp)
          .attr('fill', 'none')
          .attr('stroke', `hsl(${hues.get(key)}, 70%, 30%)`)
          .attr('stroke-width', 1.5)
          .attr(
            'd',
            d3
              .line()
              .x(function (d) {
                return xScale(moment(d.date));
              })
              .y(function (d) {
                return yScale(parseInt(d[key]));
              })
          );
      }
    });
  }, [temp, dates]);

  useEffect(() => {
    graphData();
  }, [graphData]);

  // Add X axis --> it is a date format
  /*var x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d.date; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d.value; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

	svg.append("path")
		.datum(data)
		.attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { return x(d.index) })
        .y(function(d) { return y(d[index]) })
        );*/

  /*	useEffectOnce(()=>{

	const svg = useRef();
	const width = 512;
      	const height = 512;

      // Margins
      	const margin = {top: 15, right: 35, bottom: 25, left: 25};
      	const chartRight = width - margin.right;
      	const chartBottom = height - margin.bottom;

      	const data = cumulativeData.tt;

	const chart = useCallback ((svg)=>{

		if(!cumulativeData)
			return;

		console.log (cumulativeData);
	    svg
	    	.attr("viewBox", [0, 0, width, height])
		 	.style("overflow", "visible");

		svg.append("g")
			.call(xAxis);

		svg.append("g")
			.call(yAxis);

		const path = svg.append("g")
		  .attr("fill", "none")
		  .attr("stroke", "steelblue")
		  .attr("stroke-width", 1.5)
		  .attr("stroke-linejoin", "round")
		  .attr("stroke-linecap", "round")
		.selectAll("path")
		.data(cumulativeData.tt)
		.join("path")
		  .style("mix-blend-mode", "multiply")
		  .attr("d", d => line(d.values));

		svg.call(hover, path);


		function hover(svg, path) {
  
	  if ("ontouchstart" in document) svg
	      .style("-webkit-tap-highlight-color", "transparent")
	      .on("touchmove", moved)
	      .on("touchstart", entered)
	      .on("touchend", left)
	  else svg
	      .on("mousemove", moved)
	      .on("mouseenter", entered)
	      .on("mouseleave", left);

	  const dot = svg.append("g")
	      .attr("display", "none");

	  dot.append("circle")
	      .attr("r", 2.5);

	  dot.append("text")
	      .style("font", "10px sans-serif")
	      .attr("text-anchor", "middle")
	      .attr("y", -8);

	  function moved() {
	    d3.event.preventDefault();
	    const ym = y.invert(d3.event.layerY);
	    const xm = x.invert(d3.event.layerX);
	    const i1 = d3.bisectLeft(data.dates, xm, 1);
	    const i0 = i1 - 1;
	    const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
	    const s = data.series.reduce((a, b) => Math.abs(a.values[i] - ym) < Math.abs(b.values[i] - ym) ? a : b);
	    path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
	    dot.attr("transform", `translate(${x(data.dates[i])},${y(s.values[i])})`);
	    dot.select("text").text(`${s.name} : ${s.values[i]} ` );
	  }

	  function entered() {
	    path.style("mix-blend-mode", null).attr("stroke", "#ddd");
	    dot.attr("display", null);
	  }

	  function left() {
	    path.style("mix-blend-mode", "multiply").attr("stroke", null);
	    dot.attr("display", "none");
	  }
	}

	const x = d3.
		range([margin.left, width - margin.right]);

	const y = d3.scaleLinear()
    	.domain([0, d3.max(data, d => d.value)]).nice()
    	.range([height - margin.bottom, margin.top]);

	const xAxis = g => g
    	.attr("transform", `translate(0,${height - margin.bottom})`)
    	.call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
	
	const line = d3.line()
	    .defined(d => !isNaN(d.value))
	    .x(d => x(d.date))
	    .y(d => y(d.value))

	const yAxis = g => g
	    .attr("transform", `translate(${margin.left},0)`)
	    .call(d3.axisLeft(y))
	    .call(g => g.select(".domain").remove())
	    .call(g => g.select(".tick:last-of-type text").clone()
	        .attr("x", 3)
	        .attr("text-anchor", "start")
	        .attr("font-weight", "bold")
	        .text(data.y));

	}, cumulativeData)

*/

  return (
    <React.Fragment>
      <div id="chart"></div>
    </React.Fragment>
  );
}

export default React.memo(NormalizedStates);
