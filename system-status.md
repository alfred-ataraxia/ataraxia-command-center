# Sistem Durumu — 2026-04-13 03:00

## Donanım (ataraxia / RPi 400)
```
 03:00:01 up  9:57,  2 users,  load average: 0.42, 0.51, 0.47
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.0Gi       620Mi        84Mi       1.3Gi       1.7Gi
Swap:          4.0Gi       3.0Mi       4.0Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   30G  192G  14% /
/dev/sda2       231G   30G  192G  14% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 10 hours             
homepage                    Up 10 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 10 hours             
wireguard                   Up 10 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 10 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 10 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
