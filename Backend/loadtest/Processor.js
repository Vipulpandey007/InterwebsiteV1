"use strict";

/**
 * Artillery custom processor for Gossner College load tests.
 * Provides helper functions used in loadtest.yml scenarios.
 */

/**
 * Generates a random valid Indian mobile number (starts with 6-9)
 * and sets it on the virtual user's context.
 */
function generateMobile(context, events, done) {
  const prefixes = ["6", "7", "8", "9"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Math.floor(Math.random() * 900000000 + 100000000);
  context.vars.mobile = `${prefix}${rest}`.slice(0, 10);
  return done();
}

/**
 * Logs a summary of the current virtual user's variables.
 * Useful for debugging test scenarios.
 */
function logContext(context, events, done) {
  console.log("[Artillery] Virtual user context:", {
    mobile: context.vars.mobile,
    adminToken: context.vars.adminToken ? "SET" : "NOT SET",
    userToken: context.vars.userToken ? "SET" : "NOT SET",
    appId: context.vars.appId,
  });
  return done();
}

module.exports = { generateMobile, logContext };
