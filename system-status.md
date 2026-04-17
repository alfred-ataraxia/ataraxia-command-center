# Sistem Durumu — 2026-04-17 03:00

## Donanım (ataraxia / RPi 400)
```
 03:00:01 up  5:47,  2 users,  load average: 0.61, 0.71, 0.80
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       1.9Gi       411Mi        15Mi       1.6Gi       1.8Gi
Swap:          4.0Gi       180Mi       3.8Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   36G  185G  17% /
/dev/sda2       231G   36G  185G  17% /
```

## Docker Servisleri
```
NAMES                       STATUS                 PORTS
homeassistant               Up 6 hours             
homepage                    Up 6 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 6 hours             
wireguard                   Up 6 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 6 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 6 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
