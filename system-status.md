# Sistem Durumu — 2026-04-26 23:11

## Donanım (ataraxia / RPi 400)
```
 23:11:17 up 17 min,  1 user,  load average: 2.63, 2.54, 1.82
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       3.0Gi        96Mi       4.3Mi       788Mi       749Mi
Swap:          4.0Gi       184Mi       3.8Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   40G  182G  18% /
/dev/sda2       231G   40G  182G  18% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 41 hours             
homepage                    Up 41 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 41 hours             
wireguard                   Up 41 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 41 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 41 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
