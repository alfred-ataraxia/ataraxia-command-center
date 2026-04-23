# Sistem Durumu — 2026-04-23 03:04

## Donanım (ataraxia / RPi 400)
```
 03:04:10 up 1 day,  4:36,  1 user,  load average: 1.25, 1.09, 1.16
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.8Gi       390Mi        11Mi       735Mi       926Mi
Swap:          4.0Gi       447Mi       3.6Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   39G  183G  18% /
/dev/sda2       231G   39G  183G  18% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 29 hours             
homepage                    Up 29 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 29 hours             
wireguard                   Up 29 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 29 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 29 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
