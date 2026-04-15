# Sistem Durumu — 2026-04-15 03:00

## Donanım (ataraxia / RPi 400)
```
 03:00:01 up  5:07,  1 user,  load average: 0.19, 0.31, 0.31
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.1Gi       267Mi       5.5Mi       1.5Gi       1.6Gi
Swap:          4.0Gi       858Mi       3.2Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   35G  187G  16% /
/dev/sda2       231G   35G  187G  16% /
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
