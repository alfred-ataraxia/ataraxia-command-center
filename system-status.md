# Sistem Durumu — 2026-04-20 03:02

## Donanım (ataraxia / RPi 400)
```
 03:02:49 up  4:16,  3 users,  load average: 1.59, 1.02, 1.01
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.7Gi       614Mi        18Mi       610Mi       1.0Gi
Swap:          4.0Gi       389Mi       3.6Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   38G  184G  17% /
/dev/sda2       231G   38G  184G  17% /
```

## Docker Servisleri
```
NAMES                       STATUS                 PORTS
homeassistant               Up 4 hours             
homepage                    Up 4 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 4 hours             
wireguard                   Up 4 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 4 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 4 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
