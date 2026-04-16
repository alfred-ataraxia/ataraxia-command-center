# Sistem Durumu — 2026-04-16 03:00

## Donanım (ataraxia / RPi 400)
```
 03:00:01 up 1 day,  5:07,  1 user,  load average: 0.42, 0.28, 0.29
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.1Gi       548Mi        24Mi       1.3Gi       1.6Gi
Swap:          4.0Gi       229Mi       3.8Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   35G  187G  16% /
/dev/sda2       231G   35G  187G  16% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 29 hours             
homepage                    Up 29 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 29 hours             
wireguard                   Up 29 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 29 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 29 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
