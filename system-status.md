# Sistem Durumu — 2026-04-09 03:17

## Donanım (ataraxia / RPi 400)
```
 03:17:53 up 13:02,  2 users,  load average: 1.15, 0.58, 0.49
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.0Gi        85Mi        24Mi       1.9Gi       1.7Gi
Swap:          6.0Gi       345Mi       5.7Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   31G  191G  14% /
/dev/sda2       231G   31G  191G  14% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 13 hours             
homepage                    Up 13 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 13 hours             
wireguard                   Up 13 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 13 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 13 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Servisler
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
