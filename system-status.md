# Sistem Durumu — 2026-04-29 02:03

## Donanım (ataraxia / RPi 400)
```
 02:03:20 up  5:53,  2 users,  load average: 0.72, 0.81, 0.87
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.1Gi       626Mi        55Mi       1.2Gi       1.6Gi
Swap:          4.0Gi       555Mi       3.5Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   42G  180G  19% /
/dev/sda2       231G   42G  180G  19% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 15 hours             
homepage                    Up 15 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 15 hours             
wireguard                   Up 15 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 15 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 15 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
