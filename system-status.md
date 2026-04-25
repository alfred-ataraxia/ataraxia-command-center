# Sistem Durumu — 2026-04-25 03:05

## Donanım (ataraxia / RPi 400)
```
 03:05:45 up 3 days,  4:38,  1 user,  load average: 1.76, 1.76, 1.61
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.8Gi       395Mi        12Mi       685Mi       892Mi
Swap:          4.0Gi       577Mi       3.4Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   40G  182G  18% /
/dev/sda2       231G   40G  182G  18% /
```

## Docker Servisleri
```
NAMES                       STATUS                PORTS
homeassistant               Up 3 days             
homepage                    Up 3 days (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 3 days             
wireguard                   Up 3 days             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 3 days             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 3 days             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
