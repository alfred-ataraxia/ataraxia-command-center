# Sistem Durumu — 2026-04-10 03:00

## Donanım (ataraxia / RPi 400)
```
 03:00:01 up 1 day, 12:44,  3 users,  load average: 0.15, 0.29, 0.42
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       1.9Gi       737Mi        65Mi       1.3Gi       1.8Gi
Swap:          6.0Gi       474Mi       5.5Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   29G  193G  13% /
/dev/sda2       231G   29G  193G  13% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 37 hours             
homepage                    Up 37 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 37 hours             
wireguard                   Up 5 hours              0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 37 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 37 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard (Vite Dev)
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
