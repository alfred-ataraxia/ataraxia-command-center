# Sistem Durumu — 2026-04-11 03:00

## Donanım (ataraxia / RPi 400)
```
 03:00:02 up 2 days, 12:44,  3 users,  load average: 0.46, 0.34, 0.26
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       1.9Gi       156Mi        66Mi       2.0Gi       1.9Gi
Swap:          6.0Gi       326Mi       5.7Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   29G  193G  13% /
/dev/sda2       231G   29G  193G  13% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 2 days               
homepage                    Up 12 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 2 days               
wireguard                   Up 29 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 2 days               0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 2 days               0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
