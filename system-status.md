# Sistem Durumu — 2026-05-03 03:02

## Donanım (ataraxia / RPi 400)
```
 03:02:56 up  7:13,  1 user,  load average: 1.21, 1.23, 1.17
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       1.9Gi       1.1Gi        12Mi       880Mi       1.8Gi
Swap:          4.0Gi       605Mi       3.4Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   43G  179G  20% /
/dev/sda2       231G   43G  179G  20% /
```

## Docker Servisleri
```
NAMES                       STATUS                 PORTS
homeassistant               Up 7 hours             
homepage                    Up 7 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 7 hours             
wireguard                   Up 7 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 7 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 7 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
