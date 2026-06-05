import { NextResponse } from 'next/server';
import os from 'os';

export async function GET(request) {
  const hostHeader = request.headers.get('host') || 'localhost:3000';
  const port = hostHeader.split(':')[1] || '3000';
  
  const interfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  const candidateIps = [];
  
  // Collect all external IPv4 addresses, filtering out virtual/VPN networks first
  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    
    // Ignore virtual and VPN network interfaces
    if (
      lowerName.includes('wsl') ||
      lowerName.includes('docker') ||
      lowerName.includes('vbox') ||
      lowerName.includes('virtual') ||
      lowerName.includes('vmware') ||
      lowerName.includes('vpn') ||
      lowerName.includes('nord') ||
      lowerName.includes('lynx') ||
      lowerName.includes('zerotier') ||
      lowerName.includes('tailscale') ||
      lowerName.includes('vethernet') ||
      lowerName.includes('loopback') ||
      lowerName.includes('pseudo') ||
      lowerName.includes('hamachi') ||
      lowerName.includes('radmin') ||
      lowerName.includes('tunnel') ||
      lowerName.includes('tap') ||
      lowerName.includes('tun')
    ) {
      continue;
    }
    
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidateIps.push({
          name: lowerName,
          address: iface.address
        });
      }
    }
  }

  if (candidateIps.length > 0) {
    // 1. Prioritize Wi-Fi / Wireless adapters
    const wifiIp = candidateIps.find(c => 
      c.name.includes('wi-fi') || 
      c.name.includes('wireless') || 
      c.name.includes('wlan')
    );
    
    if (wifiIp) {
      ipAddress = wifiIp.address;
    } else {
      // 2. Prioritize Ethernet adapters
      const ethernetIp = candidateIps.find(c => 
        c.name.includes('ethernet') || 
        c.name.includes('eth') || 
        c.name.includes('lan')
      );
      
      if (ethernetIp) {
        ipAddress = ethernetIp.address;
      } else {
        // 3. Fallback to first remaining standard home router IP (192.168.x.x) if available
        const standardHomeIp = candidateIps.find(c => c.address.startsWith('192.168.'));
        ipAddress = standardHomeIp ? standardHomeIp.address : candidateIps[0].address;
      }
    }
  }
  
  return NextResponse.json({
    localIp: ipAddress,
    port: port,
    localUrl: `http://${ipAddress}:${port}`
  });
}
