# Sistem Durumu — 2026-04-09 12:50

## Donanım (ataraxia / RPi 400)
```
 12:50:49 up 22:35,  3 users,  load average: 0.49, 0.52, 0.47
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       1.9Gi       205Mi        67Mi       1.9Gi       1.9Gi
Swap:          6.0Gi       308Mi       5.7Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   31G  191G  14% /
/dev/sda2       231G   31G  191G  14% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 23 hours             
homepage                    Up 23 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 23 hours             
wireguard                   Up 23 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 23 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 23 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
