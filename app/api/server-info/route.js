import { NextResponse } from 'next/server';
import os from 'os';

export async function GET(request) {
  const hostHeader = request.headers.get('host') || 'localhost:3000';
  const port = hostHeader.split(':')[1] || '3000';
  
  const interfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  const candidateIps = [];
  
  // Collect all external IPv4 addresses
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidateIps.push({
          name: name.toLowerCase(),
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
      c.name.includes('wlan') ||
      c.name.includes('wi fi')
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
        // 3. Prioritize standard home router subnets (192.168.x.x)
        const standardHomeIp = candidateIps.find(c => c.address.startsWith('192.168.'));
        if (standardHomeIp) {
          ipAddress = standardHomeIp.address;
        } else {
          // 4. Filter out common virtual adapters (WSL, Docker, VirtualBox, vEthernet)
          const physicalFallback = candidateIps.find(c => 
            !c.name.includes('vbox') && 
            !c.name.includes('virtual') && 
            !c.name.includes('wsl') && 
            !c.name.includes('docker') &&
            !c.name.includes('loopback') &&
            !c.name.includes('vethernet')
          );
          
          ipAddress = physicalFallback ? physicalFallback.address : candidateIps[0].address;
        }
      }
    }
  }
  
  return NextResponse.json({
    localIp: ipAddress,
    port: port,
    localUrl: `http://${ipAddress}:${port}`
  });
}
