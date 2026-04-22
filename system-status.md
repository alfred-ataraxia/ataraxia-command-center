# Sistem Durumu — 2026-04-22 03:04

## Donanım (ataraxia / RPi 400)
```
 03:04:36 up  4:36,  1 user,  load average: 1.96, 1.75, 1.53
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.8Gi       405Mi        11Mi       678Mi       907Mi
Swap:          4.0Gi       425Mi       3.6Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   39G  183G  18% /
/dev/sda2       231G   39G  183G  18% /
```

## Docker Servisleri
```
NAMES                       STATUS                 PORTS
homeassistant               Up 5 hours             
homepage                    Up 5 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 5 hours             
wireguard                   Up 5 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 5 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 5 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
