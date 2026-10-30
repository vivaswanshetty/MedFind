import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root /emergency redirector.
 * Direct navigation to /emergency cleanly routes to /(tabs)/emergency.
 */
export default function EmergencyRouteRedirect() {
  return <Redirect href="/(tabs)/emergency" />;
}

