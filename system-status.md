# Sistem Durumu — 2026-04-30 02:00

## Donanım (ataraxia / RPi 400)
```
 02:00:42 up 1 day,  5:50,  3 users,  load average: 0.89, 0.56, 0.48
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       1.9Gi       100Mi        19Mi       1.9Gi       1.8Gi
Swap:          4.0Gi       1.4Gi       2.6Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   42G  180G  19% /
/dev/sda2       231G   42G  180G  19% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 39 hours             
homepage                    Up 39 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 39 hours             
wireguard                   Up 39 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 39 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 39 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
