'use strict';

var CDF = require('./cdf.js');

function percentile(histogram, ps, type) {

  if (Object.keys(histogram).length < 0) return NaN;

  switch (type) {
    case 'ks':
      // Kaplan Meier freeflow
      var {cdf, n} = CDF.ksCDF(histogram);
      break;

    case 'R4':
      // R4 with linear estimation of lower extreme
      var {cdf, n} = CDF.R4CDF(histogram);
      break;

    default:
      //R5 with linear estimation of both upper and lower extremes
      return R5(histogram, ps);
  }

  return piecewiseLinearInterpolation(cdf, ps);
}


function piecewiseLinearInterpolation(cdf, ps, istart=-1) {

  if (!Array.isArray(ps)) {
    ps = [ps]
  }

  ps.sort(function (a, b) { return b - a; })  // desc order

  var speeds = Object.keys(cdf);
  var quantiles = [];

  var i = istart === -1 ? speeds.length-1 : istart;
  ps.forEach(function (p) {
    while (i > 0 && cdf[speeds[i]] >= p) i--;

    var l = +speeds[i];
    var r = +speeds[i+1];
    if (p <= cdf[speeds[i]]) [l,r] = [r,l];  // lower extreme

    quantiles.push(l + (r - l) * (p - cdf[l]) / (cdf[r] - cdf[l]));
  });

  return quantiles.length > 1 ? quantiles : quantiles[0];

}


function R5(histogram, ps) {

  var {cdf, n} = CDF.R4CDF(histogram, -0.5)

  // add a linear projection point for upper extreme value
  var speeds = Object.keys(cdf)
  var i = speeds.length-1;
  var j = speeds.length-2;
  var newspeed = 2 * speeds[i] - speeds[j];
  cdf[newspeed] = 2 * cdf[speeds[i]] - cdf[speeds[j]];

  return piecewiseLinearInterpolation(cdf, ps);

}


module.exports = percentile;