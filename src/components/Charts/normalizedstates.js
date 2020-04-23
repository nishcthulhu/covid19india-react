import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useEffectOnce, useLocalStorage, useFavicon} from 'react-use';

import * as d3 from 'd3';
import moment from 'moment';

import {sliceTimeseriesFromEnd, formatNumber} from '../../utils/commonfunctions';
import {useResizeObserver} from '../../utils/hooks';

function NormalizedStates(props) {
	let dateData = [];
	const sortDate = () => {
		
		props.data.forEach((data, index) => {
			if (data.status !== 'Confirmed') {
				return;
			}
			Object.keys(data).forEach((key) => {
		    	if (key === 'date') {
	        		dateData.push((moment(data.date).format ('YYYYMMDD')));
	        		//console.log(data.date);
	      		}
			})
		})
		dateData.sort();
	}
	sortDate();
	console.log((dateData));
	//var dates = [];
	// set the dimensions and margins of the graph
	/*var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;*/



    /*useEffect (() => {
    	dates = ['Welcomen2','that'];
    	dates.push('Welcome');
		props.data.forEach((data, index) => {
			dates.push('Welcome');
			if (data.status !== 'Confirmed') {
				return;
			}
			Object.keys(data).forEach((key) => {
		    	if (key === 'date') {
	        		dates.push('Welcome');
	      		}
			})
			//dates.sort();
		})
	},[]);*/
	return (
		<div>
			<p>{dateData.length}</p>
		</div>
	)
}

export default React.memo(NormalizedStates);