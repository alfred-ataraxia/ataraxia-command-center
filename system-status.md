# Sistem Durumu — 2026-04-24 03:03

## Donanım (ataraxia / RPi 400)
```
 03:03:51 up 2 days,  4:36,  1 user,  load average: 2.53, 1.80, 1.48
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       3.0Gi       344Mi        13Mi       594Mi       768Mi
Swap:          4.0Gi       373Mi       3.6Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   40G  182G  18% /
/dev/sda2       231G   40G  182G  18% /
```

## Docker Servisleri
```
NAMES                       STATUS                PORTS
homeassistant               Up 2 days             
homepage                    Up 2 days (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 2 days             
wireguard                   Up 2 days             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 2 days             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 2 days             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
