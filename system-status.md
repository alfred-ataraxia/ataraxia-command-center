# Sistem Durumu — 2026-04-28 02:05

## Donanım (ataraxia / RPi 400)
```
 02:05:11 up  1:43,  1 user,  load average: 1.95, 1.92, 1.83
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.6Gi       519Mi        11Mi       716Mi       1.1Gi
Swap:          4.0Gi       996Mi       3.0Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   40G  182G  19% /
/dev/sda2       231G   40G  182G  19% /
```

## Docker Servisleri
```
NAMES                       STATUS                 PORTS
homeassistant               Up 2 hours             
homepage                    Up 2 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 2 hours             
wireguard                   Up 2 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 2 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 2 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
