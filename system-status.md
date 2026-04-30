# Sistem Durumu — 2026-05-01 02:00

## Donanım (ataraxia / RPi 400)
```
 02:00:51 up 2 days,  5:50,  3 users,  load average: 1.25, 0.88, 1.03
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       3.0Gi       145Mi       7.8Mi       736Mi       745Mi
Swap:          4.0Gi       1.8Gi       2.2Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   42G  180G  19% /
/dev/sda2       231G   42G  180G  19% /
```

## Docker Servisleri
```
NAMES                       STATUS                PORTS
homeassistant               Up 2 days             
homepage                    Up 2 days (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 2 days             
wireguard                   Up 2 days             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 2 days             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 2 days             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
