# Sistem Durumu — 2026-04-12 03:00

## Donanım (ataraxia / RPi 400)
```
 03:00:01 up  7:34,  1 user,  load average: 0.56, 0.45, 0.45
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       1.7Gi       726Mi        83Mi       1.6Gi       2.0Gi
Swap:          2.0Gi          0B       2.0Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   30G  192G  14% /
/dev/sda2       231G   30G  192G  14% /
```

## Docker Servisleri
```
NAMES                       STATUS                 PORTS
homeassistant               Up 8 hours             
homepage                    Up 8 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 8 hours             
wireguard                   Up 8 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 8 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 8 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
